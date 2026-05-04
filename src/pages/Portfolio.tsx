import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trade, PortfolioItem } from '../types';
import { formatCurrency, formatPercent } from '../lib/formatters';
import { cn } from '../lib/utils';
import { Wallet, TrendingUp, TrendingDown, Clock, Activity, BarChart2 } from 'lucide-react';

export function Portfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const pQuery = query(collection(db, 'users', user.uid, 'portfolio'));
    const tQuery = query(collection(db, 'users', user.uid, 'trades'), orderBy('entryTime', 'desc'));

    const unsubP = onSnapshot(pQuery, (snapshot) => {
      setPortfolio(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem)));
      setLoading(false);
    });

    const unsubT = onSnapshot(tQuery, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade)));
    });

    return () => {
      unsubP();
      unsubT();
    };
  }, [user]);

  const combinedPortfolio = useMemo(() => {
    const items: PortfolioItem[] = [...portfolio];
    
    // Process open trades to complement the portfolio
    const openTrades = trades.filter(t => !t.exitPrice);
    const tradesBySymbol: Record<string, { qty: number, cost: number }> = {};
    
    openTrades.forEach(t => {
      if (!tradesBySymbol[t.symbol]) tradesBySymbol[t.symbol] = { qty: 0, cost: 0 };
      tradesBySymbol[t.symbol].qty += t.quantity;
      tradesBySymbol[t.symbol].cost += (t.entryPrice * t.quantity);
    });

    // Symbols already in portfolio
    const portfolioSymbols = new Set(portfolio.map(p => p.symbol));

    Object.entries(tradesBySymbol).forEach(([symbol, data]) => {
      if (!portfolioSymbols.has(symbol)) {
        const avgEntry = data.qty > 0 ? data.cost / data.qty : 0;
        items.push({
          id: `open-${symbol}`,
          symbol,
          quantity: data.qty,
          avgBuyPrice: avgEntry,
          currentPrice: avgEntry, // Default to entry for open trades without market feed
          investedValue: data.cost,
          currentValue: data.cost,
          unrealizedPnL: 0,
          lastUpdated: new Date()
        });
      }
    });

    return items;
  }, [portfolio, trades]);

  const totalInvested = combinedPortfolio.reduce((sum, item) => sum + item.investedValue, 0);
  const totalCurrentValue = combinedPortfolio.reduce((sum, item) => sum + item.currentValue, 0);
  const totalUnrealizedPnL = combinedPortfolio.reduce((sum, item) => sum + item.unrealizedPnL, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-bold tracking-tight mb-2">Portfolio Analytics</h1>
          <p className="text-text-secondary font-sans">Active positions market exposure and unrealized yields.</p>
        </div>
        <div className="flex gap-2">
          <div className="badge-live border-accent-blue/30 text-accent-blue">
            <Activity size={14} />
            SCANNING BLOCKCHAIN...
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="label-mono">Current Val.</p>
          <p className="value-large">{formatCurrency(totalCurrentValue)}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-mono">
             <span className={cn(totalUnrealizedPnL >= 0 ? "text-accent-green" : "text-accent-red")}>
               {totalUnrealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnL)}
             </span>
             <span className="text-text-muted">OPEN P&L</span>
          </div>
        </div>
        <div className="metric-card">
          <p className="label-mono">Invested</p>
          <p className="value-large text-text-secondary">{formatCurrency(totalInvested)}</p>
          <p className="metric-sub">Across {combinedPortfolio.length} assets</p>
        </div>

        <div className="metric-card">
          <p className="label-mono">Open Risk</p>
          <p className="value-large text-accent-blue">{combinedPortfolio.length}</p>
          <p className="metric-sub">Active battlegrounds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-border-subtle rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-sans font-bold text-lg tracking-tight">Active Positions</h3>
              <p className="text-xs text-text-muted font-sans">Live market valuation & unrealized yield</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Real-time Sync</span>
              <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-bg-secondary/50 label-mono text-[10px] tracking-wider uppercase">
                  <th className="px-6 py-4 font-semibold border-b border-border-subtle">Instrument</th>
                  <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">Quantity</th>
                  <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">Avg / LTP</th>
                  <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right text-text-muted">Invested</th>
                  <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">Current Value</th>
                  <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                   Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-8" colSpan={6}><div className="h-4 bg-bg-secondary rounded w-full"></div></td>
                    </tr>
                  ))
                ) : combinedPortfolio.length > 0 ? (
                  combinedPortfolio.map(item => {
                    const pnlPercent = item.avgBuyPrice > 0 ? ((item.currentPrice / item.avgBuyPrice) - 1) * 100 : 0;
                    const isOpenTrade = item.id.startsWith('open-');
                    return (
                      <tr key={item.id} className="group hover:bg-bg-secondary/30 transition-colors">
                        <td className="px-6 py-6 border-b border-border-subtle">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base tracking-tighter font-sans text-text-primary">{item.symbol}</span>
                              {isOpenTrade && (
                                <span className="text-[8px] bg-accent-blue/10 text-accent-blue px-1.5 py-0.5 rounded font-bold border border-accent-blue/20">TRADE</span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-text-muted mt-0.5 uppercase">EQUITY / NSE</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 border-b border-border-subtle text-right font-mono text-sm font-medium text-text-secondary">{item.quantity}</td>
                        <td className="px-6 py-6 border-b border-border-subtle text-right font-mono text-sm">
                          <div className="flex flex-col leading-tight">
                            <span className="text-text-primary">{formatCurrency(item.avgBuyPrice)}</span>
                            <span className="text-text-muted text-[11px] mt-0.5">{formatCurrency(item.currentPrice)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 border-b border-border-subtle text-right font-mono text-sm text-text-muted">
                          {formatCurrency(item.investedValue)}
                        </td>
                        <td className="px-6 py-6 border-b border-border-subtle text-right font-mono text-sm font-bold text-text-primary">
                          {formatCurrency(item.currentValue)}
                        </td>
                        <td className="px-6 py-6 border-b border-border-subtle text-right">
                          <div className={cn(
                            "inline-flex flex-col items-end px-3 py-1.5 rounded-xl border font-bold",
                            item.unrealizedPnL >= 0 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                              : "bg-rose-50 border-rose-100 text-rose-600"
                          )}>
                            <span className="font-mono text-sm">{item.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(item.unrealizedPnL)}</span>
                            <span className="text-[10px] font-mono opacity-80 font-medium">{pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-text-muted font-mono text-sm">
                      <div className="flex flex-col items-center gap-4">
                        <Wallet size={40} className="opacity-20" />
                        <p>CURRENTLY ZERO MARKET EXPOSURE IN DATABASE</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
