import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trade } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';
import { cn, toSafeDate } from '../lib/utils';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Tag, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Plus,
  MoreVertical,
  ExternalLink,
  Calendar,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

export function TradeLog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'trades'), orderBy('entryTime', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
      setTrades(data);
      setLoading(false);
    });
  }, [user]);

  const handleDelete = async (tradeId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this trade record?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'trades', tradeId));
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Failed to delete trade record.');
    }
  };

  const handleCloseTrade = async (trade: Trade) => {
    if (!user) return;
    const exitPrice = prompt(`Close ${trade.symbol} at:`, trade.entryPrice.toString());
    if (exitPrice && !isNaN(Number(exitPrice))) {
      try {
        const exit = Number(exitPrice);
        const pnl = (exit - trade.entryPrice) * trade.quantity * (trade.type === 'BUY' ? 1 : -1);
        const charges = 20 + (exit * trade.quantity * 0.001); // Simplified charge logic for quick close
        
        await updateDoc(doc(db, 'users', user.uid, 'trades', trade.id!), {
          exitPrice: exit,
          grossPnL: pnl,
          netPnL: pnl - charges,
          charges: charges,
          exitTime: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error closing trade:', error);
      }
    }
  };

  useEffect(() => {
    let results = trades.filter(t => 
      t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.setup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (startDate || endDate) {
      results = results.filter(t => {
        const tradeDate = toSafeDate(t.entryTime);
        const start = startDate ? startOfDay(parseISO(startDate)) : null;
        const end = endDate ? endOfDay(parseISO(endDate)) : null;

        if (start && end) {
          return isWithinInterval(tradeDate, { start, end });
        } else if (start) {
          return tradeDate >= start;
        } else if (end) {
          return tradeDate <= end;
        }
        return true;
      });
    }

    setFilteredTrades(results);
  }, [searchTerm, trades, startDate, endDate]);

  const exportToCSV = () => {
    const headers = ['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'Qty', 'Gross PnL', 'Charges', 'Net PnL', 'Setup'];
    const rows = filteredTrades.map(t => [
      formatDate(t.entryTime),
      t.symbol,
      t.type,
      t.entryPrice,
      t.exitPrice || 'OPEN',
      t.quantity,
      t.grossPnL || 0,
      t.charges,
      t.netPnL || 0,
      t.setup
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trading_alpha_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans font-bold tracking-tighter mb-2">Trade Ledger</h1>
          <p className="text-text-secondary font-sans">Historical execution archives and protocol debriefs.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/add-trade')}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent-gold text-white font-bold rounded-xl shadow-lg shadow-accent-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus size={18} />
            Log Execution
          </button>
        </div>
      </header>

      <div className="bg-white border border-border-subtle rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-4 bg-white border-b border-border-subtle flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search symbol, setup, or tags..."
              className="w-full bg-bg-secondary/50 border border-border-subtle h-11 pl-11 pr-4 rounded-xl text-sm outline-none focus:border-accent-gold focus:bg-white transition-all font-sans"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-bg-secondary/50 border border-border-subtle rounded-xl px-3 h-11">
               <Calendar size={14} className="text-text-muted" />
               <input 
                 type="date" 
                 className="bg-transparent text-[10px] font-bold text-text-secondary outline-none uppercase"
                 value={startDate}
                 onChange={e => setStartDate(e.target.value)}
               />
               <span className="text-text-muted px-1">-</span>
               <input 
                 type="date" 
                 className="bg-transparent text-[10px] font-bold text-text-secondary outline-none uppercase"
                 value={endDate}
                 onChange={e => setEndDate(e.target.value)}
               />
               <button 
                  onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
                    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
                  }}
                  className="pl-1 text-text-muted hover:text-text-primary transition-colors"
                  title="Current Month"
                >
                  <X size={14} />
                </button>
             </div>
             <button 
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 px-6 h-11 bg-text-primary text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer"
             >
               <Download size={14} />
               Export
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-bg-secondary/50 label-mono text-[10px] tracking-wider uppercase">
                <th className="px-6 py-4 font-semibold border-b border-border-subtle">Date</th>
                <th className="px-6 py-4 font-semibold border-b border-border-subtle">Script & Status</th>
                <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">Entry</th>
                <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">LTP / Market</th>
                <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">Exit</th>
                <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">Qty</th>
                <th className="px-6 py-4 font-semibold border-b border-border-subtle text-right">Net Profit</th>
                <th className="px-6 py-4 font-semibold border-b border-border-subtle text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-6 h-[72px]"><div className="h-4 bg-bg-secondary rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              ) : filteredTrades.length > 0 ? (
                filteredTrades.map(trade => {
                  const isClosed = !!trade.exitPrice;
                  // Simulate LTP for open trades slightly different from entry
                  const simulatedLTP = isClosed ? trade.exitPrice! : trade.entryPrice * (1 + (Math.random() * 0.02 - 0.01));
                  
                  return (
                    <tr 
                      key={trade.id} 
                      className="group hover:bg-bg-secondary/30 transition-colors"
                    >
                      <td className="px-6 py-5 font-mono text-xs whitespace-nowrap text-text-muted">{formatDate(trade.entryTime)}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-tighter text-text-primary uppercase">{trade.symbol}</span>
                            <span className={cn(
                              "text-[8px] px-1.5 py-0.5 rounded-full font-bold border flex items-center gap-1",
                              isClosed 
                                ? "bg-bg-secondary border-border-subtle text-text-muted" 
                                : "bg-blue-50 border-blue-100 text-blue-600 animate-pulse"
                            )}>
                              {isClosed ? <CheckCircle2 size={8} /> : <Clock size={8} />}
                              {isClosed ? 'CLOSED' : 'LIVE'}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                            {trade.type === 'BUY' ? <span className="text-emerald-600 font-bold">LONG</span> : <span className="text-rose-600 font-bold">SHORT</span>}
                            <span className="opacity-30">|</span>
                            {trade.setup}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-xs text-text-secondary">{formatCurrency(trade.entryPrice)}</td>
                      <td className="px-6 py-5 text-right font-mono text-xs font-medium text-text-primary">
                        {formatCurrency(simulatedLTP)}
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-xs text-text-secondary">
                        {isClosed ? formatCurrency(trade.exitPrice!) : <span className="text-amber-600">--</span>}
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-xs text-text-secondary font-medium">{trade.quantity}</td>
                      <td className={cn(
                        "px-6 py-5 text-right font-mono text-xs font-bold",
                        (trade.netPnL || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        <div className="flex items-center justify-end gap-1">
                          {(trade.netPnL || 0) >= 0 ? <ArrowUpRight size={14} className="opacity-70" /> : <ArrowDownRight size={14} className="opacity-70" />}
                          {formatCurrency(trade.netPnL || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          {!isClosed && (
                            <button 
                              onClick={() => handleCloseTrade(trade)}
                              title="Close Trade"
                              className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button 
                            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-all cursor-pointer"
                            title="View Details"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(trade.id!)}
                            className="p-2 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-muted font-mono text-sm">
                    NO ENGAGEMENT LOGS FOUND IN DATABASE
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
