// lib/mongodb.ts
import { Collection, Db } from 'mongodb';
import { User, Cycle, RawEvent, UserDeposit, UserWithdrawal } from './starknet-types';

export class VaultDatabase {
  constructor(private db: Db) {
    // Create indexes when database is initialized
    this.createIndexes();
  }

  // Create necessary indexes for better performance
  private async createIndexes() {
    try {
      // User collection indexes
      await this.users.createIndex({ address: 1 }, { unique: true });
      await this.users.createIndex({ lastActivity: -1 });
      
      // Cycle collection indexes
      await this.cycles.createIndex({ cycleId: 1 }, { unique: true });
      await this.cycles.createIndex({ status: 1 });
      await this.cycles.createIndex({ createdAt: -1 });
      
      // Deposits collection indexes
      await this.deposits.createIndex({ user: 1 });
      await this.deposits.createIndex({ cycleId: 1 });
      await this.deposits.createIndex({ hash: 1 });
      await this.deposits.createIndex({ timestamp: -1 });
      
      // Withdrawal requests collection indexes
      await this.withdrawalRequests.createIndex({ user: 1 });
      await this.withdrawalRequests.createIndex({ cycleId: 1 });
      await this.withdrawalRequests.createIndex({ hash: 1 });
      await this.withdrawalRequests.createIndex({ timestamp: -1 });
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  // Collections with proper typing
  get users(): Collection<User> {
    return this.db.collection<User>('users');
  }

  get cycles(): Collection<Cycle> {
    return this.db.collection<Cycle>('cycles');
  }

  get deposits(): Collection<RawEvent> {
    return this.db.collection<RawEvent>('deposits');
  }

  get withdrawalRequests(): Collection<RawEvent> {
    return this.db.collection<RawEvent>('withdrawalRequests');
  }

  // User operations - Fixed to avoid conflict
  async addUserDeposit(userAddress: string, deposit: UserDeposit): Promise<void> {
    // First, try to find if user exists
    const existingUser = await this.users.findOne({ address: userAddress });
    
    if (existingUser) {
      // User exists, just add the deposit
      await this.users.updateOne(
        { address: userAddress },
        {
          $push: { deposits: deposit },
          $set: { lastActivity: new Date() }
        }
      );
    } else {
      // User doesn't exist, create new user with the deposit
      await this.users.insertOne({
        address: userAddress,
        deposits: [deposit],
        withdrawalRequests: [],
        createdAt: new Date(),
        lastActivity: new Date()
      });
    }
  }

  async addUserWithdrawal(userAddress: string, withdrawal: UserWithdrawal): Promise<void> {
    // First, try to find if user exists
    const existingUser = await this.users.findOne({ address: userAddress });
    
    if (existingUser) {
      // User exists, just add the withdrawal
      await this.users.updateOne(
        { address: userAddress },
        {
          $push: { withdrawalRequests: withdrawal },
          $set: { lastActivity: new Date() }
        }
      );
    } else {
      // User doesn't exist, create new user with the withdrawal
      await this.users.insertOne({
        address: userAddress,
        deposits: [],
        withdrawalRequests: [withdrawal],
        createdAt: new Date(),
        lastActivity: new Date()
      });
    }
  }

  // Cycle operations
  async startCycle(cycleId: string, startTime: string, transactionHash: string, blockNumber: string): Promise<void> {
    await this.cycles.updateOne(
      { cycleId },
      {
        $setOnInsert: {
          cycleId,
          createdAt: new Date()
        },
        $set: {
          status: 'started' as const,
          startTime,
          startedAt: new Date(),
          startTransactionHash: transactionHash,
          startBlockNumber: blockNumber,
          endTime: null,
          endedAt: null,
          endTransactionHash: null,
          endBlockNumber: null
        }
      },
      { upsert: true }
    );
  }

  async endCycle(cycleId: string, endTime: string, transactionHash: string, blockNumber: string): Promise<void> {
    await this.cycles.updateOne(
      { cycleId },
      {
        $set: {
          status: 'ended' as const,
          endTime,
          endedAt: new Date(),
          endTransactionHash: transactionHash,
          endBlockNumber: blockNumber
        }
      }
    );
  }

  // Raw event operations
  async saveDepositEvent(event: RawEvent): Promise<void> {
    await this.deposits.insertOne(event);
  }

  async saveWithdrawalEvent(event: Omit<RawEvent, 'amount'>): Promise<void> {
    await this.withdrawalRequests.insertOne(event as RawEvent);
  }
}