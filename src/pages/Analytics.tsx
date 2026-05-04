import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trade } from '../types';
import { formatCurrency } from '../lib/formatters';
import { cn, toSafeDate } from '../lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  subMonths, 
  isSameMonth, 
  isSameDay,
  addMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Info, Flame } from 'lucide-react';

export function Analytics() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'trades'), orderBy('entryTime', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade)));
      setLoading(false);
    });
  }, [user]);

  const closedTrades = useMemo(() => trades.filter(t => t.exitPrice), [trades]);

  // Derived Stats
  const currentMonthTrades = useMemo(() => {
    return closedTrades.filter(t => isSameMonth(toSafeDate(t.entryTime), selectedMonth));
  }, [closedTrades, selectedMonth]);

  const stats = useMemo(() => {
    const periodPnL = currentMonthTrades.reduce((s, t) => s + (t.netPnL || 0), 0);
    const mostProfitableInPeriod = currentMonthTrades.length > 0 
      ? Math.max(...currentMonthTrades.map(t => t.netPnL || 0)) 
      : 0;
    
    const allTimeMostProfitableTrade = closedTrades.length > 0
      ? closedTrades.reduce((max, t) => (t.netPnL || 0) > (max.netPnL || 0) ? t : max, closedTrades[0])
      : null;

    const tradingDays = new Set(currentMonthTrades.map(t => format(toSafeDate(t.entryTime), 'yyyy-MM-dd'))).size;
    const inProfitDays = Array.from(new Set(currentMonthTrades.filter(t => (t.netPnL || 0) > 0).map(t => format(toSafeDate(t.entryTime), 'yyyy-MM-dd')))).length;

    // Charges calculator
    const totalCharges = currentMonthTrades.reduce((s, t) => s + (t.charges || 0), 0);
    const brokerage = currentMonthTrades.length * 40; // Example flat brokerage estimate

    return {
      periodPnL,
      mostProfitableInPeriod,
      allTimeMostProfitable: allTimeMostProfitableTrade,
      tradingDays,
      inProfitDays,
      totalTrades: currentMonthTrades.length,
      totalCharges,
      brokerage
    };
  }, [currentMonthTrades, closedTrades]);

  // Calendar Logic
  const renderMonthCalendar = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const emptyStartDays = getDay(monthStart);
    
    // Group trades by day for this month
    const monthlyTrades = closedTrades.filter(t => isSameMonth(toSafeDate(t.entryTime), date));
    const dailyPnL: Record<string, number> = {};
    monthlyTrades.forEach(t => {
      const dayKey = format(toSafeDate(t.entryTime), 'yyyy-MM-dd');
      dailyPnL[dayKey] = (dailyPnL[dayKey] || 0) + (t.netPnL || 0);
    });

    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = Array(emptyStartDays).fill(null);

    days.forEach((day, i) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return (
      <div className={cn("flex-1 min-w-[300px] px-2", isSameMonth(date, selectedMonth) ? "bg-bg-secondary/20 rounded-2xl p-4 border border-border-subtle/30" : "opacity-80")}>
        <div className="flex items-center justify-between mb-4">
          <h4 className={cn(
             "text-sm font-bold font-sans transition-colors",
             isSameMonth(date, selectedMonth) ? "text-accent-gold" : "text-text-muted"
          )}>
            {format(date, 'MMMM yyyy')}
          </h4>
          {isSameMonth(date, selectedMonth) && (
            <span className="text-[9px] px-2 py-0.5 bg-accent-gold/10 text-accent-gold rounded-full font-bold border border-accent-gold/20 tracking-tighter">
              SELECTED
            </span>
          )}
        </div>
        <div className="grid grid-cols-7 text-center mb-2 border-b border-border-subtle/20 pb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <span key={d} className="text-[10px] font-mono font-bold text-text-muted/60 uppercase">{d}</span>
          ))}
        </div>
        <div className="space-y-3">
          {weeks.map((week, wi) => {
            return (
              <div key={wi} className="space-y-1">
                <div className="grid grid-cols-7 gap-1">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="h-6"></div>;
                    const dayPnL = dailyPnL[format(day, 'yyyy-MM-dd')];
                    const isSunday = getDay(day) === 0;
                    return (
                      <div key={di} className="relative group">
                        <span className={cn(
                          "flex items-center justify-center h-7 text-[11px] font-semibold rounded-lg transition-all border border-transparent",
                          isSunday ? "text-red-500 bg-red-50/30" : "text-text-secondary",
                          dayPnL > 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm" : "",
                          dayPnL < 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm" : ""
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Specific day PnL highlight row aligned to the grid */}
                {week.some(d => d && dailyPnL[format(d, 'yyyy-MM-dd')] !== undefined) && (
                   <div className="grid grid-cols-7 gap-1">
                     {week.map((d, di) => {
                        const dayKey = d ? format(d, 'yyyy-MM-dd') : '';
                        const pnl = dailyPnL[dayKey];
                        if (pnl === undefined) return <div key={di}></div>;
                        return (
                          <div key={di} className={cn(
                            "text-[8px] py-1 px-0.5 rounded-md font-bold text-center truncate shadow-sm border leading-none transition-transform hover:scale-105",
                            pnl > 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                          )}>
                            {pnl > 0 ? '+' : ''}{Math.abs(pnl) > 999 ? (pnl/1000).toFixed(1) + 'k' : Math.round(pnl)}
                          </div>
                        );
                     })}
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Group trades by date for the detailed list
  const dailyPerformance = useMemo(() => {
    const grouped: Record<string, { pnl: number, trades: number, symbols: Set<string> }> = {};
    currentMonthTrades.forEach(t => {
      const date = format(toSafeDate(t.entryTime), 'yyyy-MM-dd');
      if (!grouped[date]) grouped[date] = { pnl: 0, trades: 0, symbols: new Set() };
      grouped[date].pnl += (t.netPnL || 0);
      grouped[date].trades += 1;
      grouped[date].symbols.add(t.symbol);
    });
    return Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, data]) => ({ date, ...data }));
  }, [currentMonthTrades]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-10">
      {/* View Selector */}
      <div className="flex border-b border-border-subtle">
        <button 
          onClick={() => setView('monthly')}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-all",
            view === 'monthly' ? "border-accent-green text-accent-green" : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          Monthly
        </button>
        <button 
          onClick={() => setView('yearly')}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-all",
            view === 'yearly' ? "border-accent-green text-accent-green" : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          Yearly
        </button>
      </div>

      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-sans tracking-tight">
          Monthly Snapshot: {format(selectedMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
            className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors border border-border-subtle"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
            className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors border border-border-subtle"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border-subtle rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="p-8 border-r border-border-subtle space-y-4">
          <div>
            <p className="text-text-muted text-xs font-sans mb-1">Net Realised P&L</p>
            <h3 className={cn(
              "text-3xl font-bold font-sans",
              stats.periodPnL >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(stats.periodPnL)}
            </h3>
            <p className="text-[10px] text-text-muted font-sans mt-1 uppercase">for {format(selectedMonth, 'MMM yyyy')}</p>
          </div>
        </div>
        <div className="p-8 border-r border-border-subtle space-y-4">
          <div>
            <p className="text-text-muted text-xs font-sans mb-1">Most Profitable (in this period)</p>
            <h3 className="text-3xl font-bold font-sans text-emerald-500">
              {formatCurrency(stats.mostProfitableInPeriod)}
            </h3>
          </div>
        </div>
        <div className="p-8 space-y-4">
          <div>
            <p className="text-text-muted text-xs font-sans mb-1">Most Profitable (of all time)</p>
            <h3 className="text-3xl font-bold font-sans text-text-primary">
              {stats.allTimeMostProfitable ? formatCurrency(stats.allTimeMostProfitable.netPnL || 0) : '₹0.00'}
            </h3>
            <p className="text-[10px] text-text-muted font-sans mt-1 uppercase">
              {stats.allTimeMostProfitable?.symbol || 'NO TRADES'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-bg-secondary/30 border border-border-subtle rounded-xl p-4 flex flex-wrap gap-x-12 gap-y-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-sans">Trading Days:</span>
          <span className="text-sm font-bold font-sans">{stats.tradingDays}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-sans">Traded On:</span>
          <span className="text-sm font-bold font-sans">{stats.totalTrades}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-sans">In-Profit Days:</span>
          <span className="text-sm font-bold font-sans">{stats.inProfitDays}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-sans">Winning Streak:</span>
          <span className="text-sm font-bold font-sans">1</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-sans">Current Streak:</span>
          <span className="text-sm font-bold font-sans">1</span>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-border-subtle bg-white/50">
          <div>
            <h3 className="font-sans font-bold text-lg tracking-tight">Financial Heatmap</h3>
            <p className="text-xs text-text-muted">Visualizing daily performance intensity</p>
          </div>
          <div className="flex items-center gap-1">
            <button 
               onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
               className="p-1.5 hover:bg-bg-secondary rounded border border-border-subtle transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
               onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
               className="p-1.5 hover:bg-bg-secondary rounded border border-border-subtle transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="p-8">
           <div className="flex flex-col xl:flex-row gap-8 overflow-x-auto pb-4">
              {/* Render last 3 months to save space and look cleaner */}
              {[2, 1, 0].map(offset => (
                 <React.Fragment key={offset}>
                    {renderMonthCalendar(subMonths(selectedMonth, offset))}
                 </React.Fragment>
              ))}
           </div>

           <div className="mt-10 pt-6 border-t border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-text-muted">
                <Flame size={14} className="text-accent-orange" />
                <p className="text-xs font-sans">
                  {format(selectedMonth, 'MMMM yyyy')}: Number of profitable days is {stats.inProfitDays}/{stats.tradingDays} traded days
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/20 rounded"></div>
                  <span className="text-[10px] text-text-muted font-bold">PROFIT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-rose-500/20 border border-rose-500/20 rounded"></div>
                  <span className="text-[10px] text-text-muted font-bold">LOSS</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Daily Performance Breakdown */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-white/50">
          <h3 className="font-sans font-bold text-lg tracking-tight">Daily Breakdown</h3>
          <span className="text-xs font-mono text-text-muted uppercase tracking-widest">{format(selectedMonth, 'MMM yyyy')} Log</span>
        </div>
        <div className="overflow-x-auto">
          {dailyPerformance.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-secondary/30 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  <th className="px-8 py-4 border-b border-border-subtle">Date</th>
                  <th className="px-8 py-4 border-b border-border-subtle">Engagements</th>
                  <th className="px-8 py-4 border-b border-border-subtle">Instruments Traded</th>
                  <th className="px-8 py-4 border-b border-border-subtle text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {dailyPerformance.map(day => (
                  <tr key={day.date} className="group hover:bg-bg-secondary/40 transition-colors">
                    <td className="px-8 py-4">
                      <span className="font-mono text-xs font-bold text-text-primary">{format(new Date(day.date), 'dd MMM, yyyy')}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs font-medium text-text-secondary">{day.trades} {day.trades === 1 ? 'Execution' : 'Executions'}</span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.from(day.symbols).map(s => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 bg-bg-secondary border border-border-subtle rounded font-bold text-text-muted">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className={cn(
                        "font-mono text-xs font-bold",
                        day.pnl >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {day.pnl >= 0 ? '+' : ''}{formatCurrency(day.pnl)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-text-muted font-sans italic">
              No trading activity recorded for the selected month.
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex items-center gap-2">
          <h3 className="font-sans font-bold text-lg tracking-tight">Monthly Summary</h3>
          <span className="text-sm text-text-muted font-sans">for {format(selectedMonth, 'MMMM yyyy')}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-border-subtle">
           {[
             { label: 'Overall P&L', value: stats.periodPnL, highlight: true },
             { label: 'Net P&L', value: stats.periodPnL, highlight: true },
             { label: 'Total Trades', value: stats.totalTrades, isCurrency: false },
             { label: 'Charges', value: stats.totalCharges, hasInfo: true },
             { label: 'Brokerage', value: stats.brokerage }
           ].map((item, i) => (
              <div key={i} className="p-8 space-y-2">
                 <div className="flex items-center gap-1">
                    <span className="text-text-muted text-[11px] uppercase tracking-wider font-sans">{item.label}</span>
                    {item.hasInfo && <Info size={10} className="text-text-muted cursor-help" />}
                 </div>
                 <p className={cn(
                   "text-xl font-bold font-sans",
                   item.highlight ? (item.value >= 0 ? "text-accent-green" : "text-accent-red") : "text-text-primary"
                 )}>
                   {item.isCurrency === false ? item.value : formatCurrency(item.value)}
                 </p>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}

