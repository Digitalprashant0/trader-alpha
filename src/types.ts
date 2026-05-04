export type TradeType = 'BUY' | 'SELL';

export interface Trade {
  id: string;
  symbol: string;
  type: TradeType;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryTime: any; // Firestore Timestamp
  exitTime?: any; // Firestore Timestamp
  grossPnL?: number;
  charges: number;
  netPnL?: number;
  setup: string;
  notes?: string;
  tags: string[];
  screenshot?: string;
  createdAt: any;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  unrealizedPnL: number;
  lastUpdated: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: any;
  settings: Record<string, any>;
}

export type FundingType = 'STAKEHOLDER' | 'PLATFORM';

export interface FundingTransaction {
  id: string;
  type: FundingType;
  source: string; // raman, prashant, jaswant OR zerodha, dhan, etc.
  amount: number;
  date: any;
  note?: string;
  createdAt: any;
}
