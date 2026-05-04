import { Trade } from '../types';

export const calculateTradePnL = (trade: Partial<Trade>) => {
  if (!trade.entryPrice || !trade.quantity || !trade.type) return { gross: 0, net: 0 };
  
  const exitPrice = trade.exitPrice || trade.entryPrice;
  const gross = trade.type === 'BUY'
    ? (exitPrice - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - exitPrice) * trade.quantity;
    
  const net = gross - (trade.charges || 0);
  
  return { gross, net };
};

export const calculateAggregatedMetrics = (trades: Trade[]) => {
  const closedTrades = trades.filter(t => t.exitPrice);
  const winners = closedTrades.filter(t => (t.netPnL || 0) > 0);
  const losers = closedTrades.filter(t => (t.netPnL || 0) <= 0);

  const netPnL = closedTrades.reduce((s, t) => s + (t.netPnL || 0), 0);
  const grossPnL = closedTrades.reduce((s, t) => s + (t.grossPnL || 0), 0);
  const totalCharges = closedTrades.reduce((s, t) => s + (t.charges || 0), 0);
  const winRate = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;

  const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + (t.netPnL || 0), 0) / winners.length : 0;
  const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((s, t) => s + (t.netPnL || 0), 0) / losers.length) : 0;

  const grossProfit = winners.reduce((s, t) => s + (t.netPnL || 0), 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + (t.netPnL || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const netPnLs = closedTrades.map(t => t.netPnL || 0);
  const bestTrade = netPnLs.length > 0 ? Math.max(...netPnLs) : 0;
  const worstTrade = netPnLs.length > 0 ? Math.min(...netPnLs) : 0;

  return {
    netPnL,
    grossPnL,
    totalCharges,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    bestTrade,
    worstTrade,
    totalTrades: closedTrades.length,
    winnersCount: winners.length,
    losersCount: losers.length
  };
};
