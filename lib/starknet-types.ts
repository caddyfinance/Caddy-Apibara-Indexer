// lib/types.ts
export interface UserDeposit {
    amount: string;
    cycleId: string;
    transactionHash: string;
    blockNumber: string;
    timestamp: Date;
  }
  
  export interface UserWithdrawal {
    cycleId: string;
    transactionHash: string;
    blockNumber: string;
    timestamp: Date;
  }
  
  export interface User {
    _id?: string;
    address: string;
    deposits: UserDeposit[];
    withdrawalRequests: UserWithdrawal[];
    createdAt: Date;
    lastActivity: Date;
  }
  
  export interface Cycle {
    _id?: string;
    cycleId: string;
    status: 'started' | 'ended';
    startTime?: string;
    endTime?: string | null;
    startedAt?: Date;
    endedAt?: Date | null;
    startTransactionHash?: string;
    endTransactionHash?: string | null;
    startBlockNumber?: string;
    endBlockNumber?: string | null;
    createdAt: Date;
  }
  
  export interface RawEvent {
    user: string; // address from
    name: string  // event name
    amount?: string; // 
    cycleId: string; // 
    hash: string; // transaction hash
    status: string; // transaction status
    address: string; // event address
    timestamp: Date;
  }