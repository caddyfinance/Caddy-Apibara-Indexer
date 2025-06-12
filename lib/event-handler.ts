import { VaultDatabase } from './mongo-service';
import { UserDeposit, UserWithdrawal } from './starknet-types';

export class EventHandlers {
  constructor(private db: VaultDatabase) {}

  async handleDeposit(
    user: string,
    amount: string,
    cycleId: string,
    transactionHash: string,
    blockNumber: bigint | undefined,
    eventAddress: string,
    transactionStatus: string
  ): Promise<void> {
    console.log("Deposit event:", { user, amount, cycleId });

    const blockNumberStr = blockNumber?.toString() || '0';

    // Save raw event
    await this.db.saveDepositEvent({
      user,
      name: "Deposited",
      amount,
      cycleId,
      hash: transactionHash,
      status: transactionStatus,
      address: eventAddress,
      timestamp: new Date(),
    });

    // Update user collection
    const deposit: UserDeposit = {
      amount,
      cycleId,
      transactionHash,
      blockNumber: blockNumberStr,
      timestamp: new Date()
    };

    await this.db.addUserDeposit(user, deposit);
  }

  async handleWithdrawal(
    user: string,
    cycleId: string,
    transactionHash: string,
    blockNumber: bigint | undefined,
    eventAddress: string,
    transactionStatus: string
  ): Promise<void> {
    console.log("Withdrawal event:", { user, cycleId });

    const blockNumberStr = blockNumber?.toString() || '0';

    // Save raw event
    await this.db.saveWithdrawalEvent({
      user,
      name: "WithdrawalRequested",
      cycleId,
      hash: transactionHash,
      status: transactionStatus,
      address: eventAddress,
      timestamp: new Date()
    });

    // Update user collection
    const withdrawal: UserWithdrawal = {
      cycleId,
      transactionHash,
      blockNumber: blockNumberStr,
      timestamp: new Date()
    };

    await this.db.addUserWithdrawal(user, withdrawal);
  }

  async handleCycleStart(
    cycleId: string,
    startTime: string,
    transactionHash: string,
    blockNumber: bigint | undefined
  ): Promise<void> {
    console.log("Cycle started:", { cycleId, startTime });

    await this.db.startCycle(
      cycleId,
      startTime,
      transactionHash,
      blockNumber?.toString() || '0'
    );
  }

  async handleCycleEnd(
    cycleId: string,
    endTime: string,
    transactionHash: string,
    blockNumber: bigint | undefined
  ): Promise<void> {
    console.log("Cycle ended:", { cycleId, endTime });

    await this.db.endCycle(
      cycleId,
      endTime,
      transactionHash,
      blockNumber?.toString() || '0'
    );
  }
}
