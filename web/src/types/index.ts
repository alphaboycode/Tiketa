export interface TierData {
  id: number;
  name: string;
  maxSupply: bigint;
  price: bigint; // in wei (18 decimals)
  priceFormatted: string; // in BOT
  currentSupply: bigint;
  remainingSupply: bigint;
  active: boolean;
  exists: boolean;
}

export interface UserTicket {
  tierId: number;
  name: string;
  quantity: bigint;
  priceFormatted: string;
}

export interface TxState {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  message?: string;
  action?: string;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isOwner: boolean;
  balance: string;
}
