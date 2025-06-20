import { VaultDatabase } from './mongo-service';
import { UserDeposit, UserWithdrawal, UserYieldWithdrawal } from './starknet-types';

export class EventHandlers {
  constructor(private db: VaultDatabase) {}

  // Helper function to convert hex to decimal string
  private hexToDecimal(hex: string): string {
    if (hex.startsWith('0x')) {
      return BigInt(hex).toString();
    }
    return hex;
  }

  // Helper function to convert hex timestamp to unix timestamp string
  private hexToUnixTimestamp(hex: string): string {
    if (hex.startsWith('0x')) {
      return BigInt(hex).toString();
    }
    return hex;
  }

  async handleDeposit(
    user: string,
    amount: string,
    cycleId: string,
    transactionHash: string,
    blockNumber: bigint | undefined,
    eventAddress: string,
    transactionStatus: string
  ): Promise<void> {
    const readableCycleId = this.hexToDecimal(cycleId);
    const readableAmount = this.hexToDecimal(amount);
    
    console.log("Deposit event:", { user, amount: readableAmount, cycleId: readableCycleId });

    const blockNumberStr = blockNumber?.toString() || '0';

    // Save raw event
    await this.db.saveDepositEvent({
      user,
      name: "Deposited",
      amount: readableAmount,
      cycleId: readableCycleId,
      hash: transactionHash,
      status: transactionStatus,
      address: eventAddress,
      timestamp: new Date(),
    });

    // Update user collection
    const deposit: UserDeposit = {
      amount: readableAmount,
      cycleId: readableCycleId,
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
    const readableCycleId = this.hexToDecimal(cycleId);
    
    console.log("Withdrawal event:", { user, cycleId: readableCycleId });

    const blockNumberStr = blockNumber?.toString() || '0';

    // Save raw event
    await this.db.saveWithdrawalEvent({
      user,
      name: "WithdrawalRequested",
      cycleId: readableCycleId,
      hash: transactionHash,
      status: transactionStatus,
      address: eventAddress,
      timestamp: new Date()
    });

    // Update user collection
    const withdrawal: UserWithdrawal = {
      cycleId: readableCycleId,
      transactionHash,
      blockNumber: blockNumberStr,
      timestamp: new Date()
    };

    await this.db.addUserWithdrawal(user, withdrawal);
  }

  async handleYieldWithdrawal(
    user: string,
    amount: string,
    cycleId: string,
    transactionHash: string,
    blockNumber: bigint | undefined,
    eventAddress: string,
    transactionStatus: string
  ): Promise<void> {
    const readableCycleId = this.hexToDecimal(cycleId);
    const readableAmount = this.hexToDecimal(amount);
    
    console.log("Yield withdrawal event:", { user, amount: readableAmount, cycleId: readableCycleId });

    const blockNumberStr = blockNumber?.toString() || '0';

    // Save raw event
    await this.db.saveYieldWithdrawalEvent({
      user,
      name: "YieldWithdrawn",
      amount: readableAmount,
      cycleId: readableCycleId,
      hash: transactionHash,
      status: transactionStatus,
      address: eventAddress,
      timestamp: new Date(),
    });

    // Update user collection
    const yieldWithdrawal: UserYieldWithdrawal = {
      amount: readableAmount,
      cycleId: readableCycleId,
      transactionHash,
      blockNumber: blockNumberStr,
      timestamp: new Date()
    };

    await this.db.addUserYieldWithdrawal(user, yieldWithdrawal);
  }

  async handleCycleStart(
    cycleId: string,
    startTime: string,
    transactionHash: string,
    blockNumber: bigint | undefined
  ): Promise<void> {
    const readableCycleId = this.hexToDecimal(cycleId);
    const readableStartTime = this.hexToUnixTimestamp(startTime);
    
    console.log("Cycle started:", { cycleId: readableCycleId, startTime: readableStartTime });

    await this.db.startCycle(
      readableCycleId,
      readableStartTime,
      transactionHash,
      blockNumber?.toString() || '0'
    );
  }

  async handleCycleEnd(
    cycleId: string,
    total_yield: string,
    treasury_fee: string,
    transactionHash: string,
    blockNumber: bigint | undefined
  ): Promise<void> {
    const readableCycleId = this.hexToDecimal(cycleId);
    const readableTotalYield = this.hexToDecimal(total_yield);
    const readableTreasuryFee = this.hexToDecimal(treasury_fee);
    
    console.log("Cycle ended:", { cycleId: readableCycleId, total_yield: readableTotalYield, treasury_fee: readableTreasuryFee });

    await this.db.endCycle(
      readableCycleId,
      readableTotalYield,
      readableTreasuryFee,
      transactionHash,
      blockNumber?.toString() || '0'
    );
  }
}
