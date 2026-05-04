import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trade, PortfolioItem } from '../types';
import { calculateAggregatedMetrics } from '../lib/calculations';
import { MetricCard } from '../components/MetricCard';
import { formatCurrency, formatPercent } from '../lib/formatters';
import { cn, toSafeDate } from '../lib/utils';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function Dashboard() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const tradesQuery = query(
      collection(db, 'users', user.uid, 'trades'),
      orderBy('entryTime', 'desc')
    );

    const portfolioQuery = query(
      collection(db, 'users', user.uid, 'portfolio')
    );

    const unsubTrades = onSnapshot(tradesQuery, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade)));
      setLoading(false);
    });

    const unsubPortfolio = onSnapshot(portfolioQuery, (snapshot) => {
      setPortfolio(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem)));
    });

    return () => {
      unsubTrades();
      unsubPortfolio();
    };
  }, [user]);

  const metrics = calculateAggregatedMetrics(trades);

  const activePortfolio = useMemo(() => {
    const items: PortfolioItem[] = [...portfolio];
    const openTrades = trades.filter(t => !t.exitPrice);
    const tradesBySymbol: Record<string, { qty: number, cost: number }> = {};
    
    openTrades.forEach(t => {
      if (!tradesBySymbol[t.symbol]) tradesBySymbol[t.symbol] = { qty: 0, cost: 0 };
      tradesBySymbol[t.symbol].qty += t.quantity;
      tradesBySymbol[t.symbol].cost += (t.entryPrice * t.quantity);
    });

    const portfolioSymbols = new Set(portfolio.map(p => p.symbol));

    Object.entries(tradesBySymbol).forEach(([symbol, data]) => {
      if (!portfolioSymbols.has(symbol)) {
        const avgEntry = data.qty > 0 ? data.cost / data.qty : 0;
        items.push({
          id: `open-${symbol}`,
          symbol,
          quantity: data.qty,
          avgBuyPrice: avgEntry,
          currentPrice: avgEntry,
          investedValue: data.cost,
          currentValue: data.cost,
          unrealizedPnL: 0,
          lastUpdated: new Date()
        });
      }
    });
    return items;
  }, [portfolio, trades]);

  // Prepare chart data
  const closedTrades = [...trades].filter(t => t.exitPrice).sort((a, b) => {
    const timeA = toSafeDate(a.exitTime || a.entryTime).getTime();
    const timeB = toSafeDate(b.exitTime || b.entryTime).getTime();
    return timeA - timeB;
  });

  let cumulative = 0;
  const equityData = closedTrades.map(t => {
    cumulative += t.netPnL || 0;
    return cumulative;
  });

  const equityLabels = closedTrades.map(t => {
    const d = toSafeDate(t.exitTime || t.entryTime);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  });

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
        bodyColor: '#64748b',
        bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        cornerRadius: 12,
        callbacks: {
          label: (context: any) => `Equity: ${formatCurrency(context.raw)}`,
          title: (tooltipItems: any) => `Date: ${tooltipItems[0].label}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          color: '#94a3b8', 
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        position: 'right',
        grid: { color: '#f1f5f9', drawTicks: false },
        ticks: { 
          color: '#94a3b8', 
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          callback: (v: any) => '₹' + (v >= 1000 ? (v/1000).toFixed(1) + 'k' : v)
        }
      }
    }
  };

  const equityChartData = useMemo(() => ({
    labels: equityLabels,
    datasets: [{
      label: 'Equity',
      data: equityData,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 2,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#10b981',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#10b981',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
    }]
  }), [equityLabels, equityData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-sans font-bold tracking-tight mb-2">Alpha Terminal</h1>
          <p className="text-text-secondary font-sans max-w-lg">
            High-fidelity execution metrics and performance overview. Powered by Gemini.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="badge-live">
            <span className="dot-pulse"></span>
            ENGINE: LIVE
          </div>
          <div className="w-10 h-10 rounded-full bg-border-active flex items-center justify-center font-mono text-sm border border-border-default overflow-hidden">
             {user?.photoURL ? <img src={user.photoURL} alt="User" /> : user?.displayName?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <MetricCard 
          label="Net P&L" 
          value={metrics.netPnL} 
          subLabel={`GROSS: ${formatCurrency(metrics.grossPnL)}`}
          loading={loading}
        />
        <MetricCard 
          label="Win Rate" 
          value={formatPercent(metrics.winRate)} 
          subLabel={`${metrics.winnersCount} WIN / ${metrics.losersCount} LOSS`}
          isCurrency={false}
          trend={metrics.winRate > 50 ? 'up' : 'down'}
          loading={loading}
        />
        <MetricCard 
          label="Profit Factor" 
          value={metrics.profitFactor.toFixed(2)} 
          subLabel="W/L CONTRIBUTION"
          isCurrency={false}
          trend={metrics.profitFactor > 1 ? 'up' : 'down'}
          loading={loading}
        />
        <MetricCard 
          label="Total Charges" 
          value={metrics.totalCharges} 
          subLabel="BROKERAGE & TAXES"
          trend="down"
          loading={loading}
        />
        <MetricCard 
          label="Avg Win" 
          value={metrics.avgWin} 
          subLabel={`AVG LOSS: ${formatCurrency(metrics.avgLoss)}`}
          loading={loading}
        />
        <MetricCard 
          label="Best Trade" 
          value={metrics.bestTrade} 
          subLabel={`WORST: ${formatCurrency(metrics.worstTrade)}`}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="metric-card h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="label-mono">Equity Curve</p>
              <p className="text-xs text-text-secondary">Cumulative Net Performance</p>
            </div>
            <div className="text-xs font-mono text-text-muted">ALL TIME</div>
          </div>
          <div className="h-[300px]">
            {equityData.length > 0 ? (
              <Line data={equityChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted font-mono text-sm">
                Insufficient data for equity curve
              </div>
            )}
          </div>
        </div>

        <div className="metric-card flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="label-mono">Active Battleground</p>
              <p className="text-xs text-text-secondary">Live exposure & unrealized yield</p>
            </div>
            <span className="text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded border border-accent-blue/20">LIVE</span>
          </div>
          
          <div className="flex-1 overflow-auto">
            {activePortfolio.length > 0 ? (
              <table className="w-full text-left text-sm font-sans border-separate border-spacing-0">
                <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
                  <tr className="label-mono">
                    <th className="pb-3 px-4 font-semibold border-b border-border-subtle">Symbol</th>
                    <th className="pb-3 px-4 font-semibold border-b border-border-subtle text-right">Qty</th>
                    <th className="pb-3 px-4 font-semibold border-b border-border-subtle text-right">Buy/CMP</th>
                    <th className="pb-3 px-4 font-semibold border-b border-border-subtle text-right">PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {activePortfolio.map(item => (
                    <tr key={item.id} className="group hover:bg-bg-secondary transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs border-b border-border-subtle">
                        <div className="flex items-center gap-1">
                          {item.id.startsWith('open-') && <div className="w-1 h-1 bg-accent-blue rounded-full"></div>}
                          {item.symbol}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right border-b border-border-subtle text-text-secondary">{item.quantity}</td>
                      <td className="py-3 px-4 text-right border-b border-border-subtle">
                        <div className="flex flex-col text-[11px] leading-tight">
                          <span className="text-text-primary font-medium">{formatCurrency(item.avgBuyPrice)}</span>
                          <span className="text-text-muted">{formatCurrency(item.currentPrice)}</span>
                        </div>
                      </td>
                      <td className={cn(
                        "py-3 px-4 text-right border-b border-border-subtle font-bold",
                        item.unrealizedPnL >= 0 ? "text-accent-green" : "text-accent-red"
                      )}>
                        <div className="flex flex-col items-end leading-tight">
                          <span>{formatCurrency(item.unrealizedPnL)}</span>
                          <span className="text-[10px] opacity-80">{(item.avgBuyPrice > 0 && (item.currentPrice / item.avgBuyPrice) - 1 > 0 ? '+' : '')}{(item.avgBuyPrice > 0 ? (((item.currentPrice / item.avgBuyPrice) - 1) * 100).toFixed(1) : '0.0')}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted gap-2">
                <div className="w-8 h-8 rounded-full border border-border-subtle animate-pulse"></div>
                <p className="font-mono text-xs">NO ACTIVE BATTLEGROUND POSITIONS</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
