// lib/mongodb.ts
import { Collection, Db } from 'mongodb';
import { User, Cycle, RawEvent, UserDeposit, UserWithdrawal } from './starknet-types';

export class VaultDatabase {
  constructor(private db: Db) {}

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

  // User operations
  async addUserDeposit(userAddress: string, deposit: UserDeposit): Promise<void> {
    await this.users.updateOne(
      { address: userAddress },
      {
        $setOnInsert: { 
          address: userAddress,
          deposits: [],
          withdrawalRequests: [],
          createdAt: new Date()
        },
        $push: { deposits: deposit },
        $set: { lastActivity: new Date() }
      },
      { upsert: true }
    );
  }

  async addUserWithdrawal(userAddress: string, withdrawal: UserWithdrawal): Promise<void> {
    await this.users.updateOne(
      { address: userAddress },
      {
        $setOnInsert: { 
          address: userAddress,
          deposits: [],
          withdrawalRequests: [],
          createdAt: new Date()
        },
        $push: { withdrawalRequests: withdrawal },
        $set: { lastActivity: new Date() }
      },
      { upsert: true }
    );
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