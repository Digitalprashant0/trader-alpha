import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FundingTransaction, FundingType } from '../types';
import { formatCurrency } from '../lib/formatters';
import { 
  Plus, 
  Users, 
  Layers, 
  History, 
  Trash2, 
  Wallet,
  ArrowDownCircle,
  PiggyBank,
  Building2,
  AlertCircle
} from 'lucide-react';

const STAKEHOLDERS = ['Raman', 'Prashant', 'Jaswant'];
const PLATFORMS = ['Zerodha', 'Dhan', 'Groww', 'Upstox', 'Others'];

export function Funds() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FundingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [type, setType] = useState<FundingType>('STAKEHOLDER');
  const [source, setSource] = useState(STAKEHOLDERS[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'funding'),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundingTransaction));
      setTransactions(data);
      setLoading(false);
    });
  }, [user]);

  const stats = useMemo(() => {
    const stakeholderTotals: Record<string, number> = {};
    const platformTotals: Record<string, number> = {};
    let totalStakeholder = 0;
    let totalPlatform = 0;

    transactions.forEach(t => {
      if (t.type === 'STAKEHOLDER') {
        stakeholderTotals[t.source] = (stakeholderTotals[t.source] || 0) + t.amount;
        totalStakeholder += t.amount;
      } else {
        platformTotals[t.source] = (platformTotals[t.source] || 0) + t.amount;
        totalPlatform += t.amount;
      }
    });

    return { stakeholderTotals, platformTotals, totalStakeholder, totalPlatform };
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || parseFloat(amount) <= 0) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'funding'), {
        type,
        source,
        amount: parseFloat(amount),
        date: new Date(date),
        note,
        createdAt: serverTimestamp()
      });
      setAmount('');
      setNote('');
    } catch (error) {
      console.error('Error adding fund:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Delete this record?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'funding', id));
    } catch (error) {
      console.error('Error deleting fund:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="dot-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="label-mono mb-1">Capital Management</p>
          <h1 className="text-4xl font-sans font-extrabold tracking-tighter text-text-primary">FUNDING POOL</h1>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="metric-card bg-bg-secondary/50 border-accent-gold/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-accent-gold/10 rounded-lg text-accent-gold">
              <Users size={20} />
            </div>
            <p className="label-mono text-[10px] uppercase font-bold">Stakeholder Contribution</p>
          </div>
          <p className="value-large text-text-primary">{formatCurrency(stats.totalStakeholder)}</p>
          <div className="mt-4 space-y-2">
            {STAKEHOLDERS.map(name => (
              <div key={name} className="flex justify-between items-center text-xs">
                <span className="text-text-secondary font-mono">{name}</span>
                <span className="font-bold text-text-primary">{formatCurrency(stats.stakeholderTotals[name] || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-card bg-bg-secondary/50 border-accent-blue/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-accent-blue/10 rounded-lg text-accent-blue">
              <Building2 size={20} />
            </div>
            <p className="label-mono text-[10px] uppercase font-bold">Platform Allocation</p>
          </div>
          <p className="value-large text-text-primary">{formatCurrency(stats.totalPlatform)}</p>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
            {PLATFORMS.map(name => (
              <div key={name} className="flex justify-between items-center text-xs">
                <span className="text-text-secondary font-mono">{name}</span>
                <span className="font-bold text-text-primary">{formatCurrency(stats.platformTotals[name] || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border-subtle rounded-2xl p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <Plus size={18} className="text-accent-gold" />
              <h2 className="text-lg font-bold tracking-tight">Add Transaction</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex p-1 bg-bg-secondary rounded-xl">
                <button
                  type="button"
                  onClick={() => { setType('STAKEHOLDER'); setSource(STAKEHOLDERS[0]); }}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${type === 'STAKEHOLDER' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                >
                  Stakeholder
                </button>
                <button
                  type="button"
                  onClick={() => { setType('PLATFORM'); setSource(PLATFORMS[0]); }}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${type === 'PLATFORM' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                >
                  Platform
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest px-1">Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full h-11 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-border-active transition-all"
                >
                  {(type === 'STAKEHOLDER' ? STAKEHOLDERS : PLATFORMS).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest px-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-11 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-border-active transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest px-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-border-active transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest px-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional context..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-11 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-border-active transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-text-primary text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 mt-2"
              >
                {submitting ? 'Recording...' : 'Record Transaction'}
              </button>
            </form>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-bg-secondary/30 border-b border-border-subtle flex items-center gap-2">
              <History size={16} className="text-text-muted" />
              <h2 className="text-sm font-bold uppercase tracking-tight text-text-secondary">Recent Transactions</h2>
            </div>
            
            <div className="overflow-x-auto">
              {transactions.length > 0 ? (
                <table className="w-full text-left text-sm font-sans">
                  <thead>
                    <tr className="label-mono bg-bg-secondary/10">
                      <th className="px-6 py-4 font-bold uppercase text-[10px]">Date</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px]">Type</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px]">Source</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] text-right">Amount</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {transactions.map(t => (
                      <tr key={t.id} className="group hover:bg-bg-secondary transition-colors">
                        <td className="px-6 py-4 text-text-secondary font-mono text-[11px]">
                          {new Date(t.date.toDate ? t.date.toDate() : t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            t.type === 'STAKEHOLDER' 
                              ? 'bg-accent-gold/5 text-accent-gold border-accent-gold/20' 
                              : 'bg-accent-blue/5 text-accent-blue border-accent-blue/20'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary">{t.source}</span>
                            {t.note && <span className="text-[10px] text-text-muted italic">{t.note}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-bold text-text-primary">{formatCurrency(t.amount)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center">
                  <PiggyBank size={32} className="mx-auto text-text-muted mb-3 opacity-20" />
                  <p className="text-sm font-mono text-text-muted">No transactions recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-xl">
             <AlertCircle size={16} className="text-accent-blue mt-0.5" />
             <p className="text-[11px] text-accent-blue/80 font-medium leading-relaxed">
               Stakeholder funds represent the total capital pool contributed by Raman, Prashant, and Jaswant. Platform allocation shows how this pool is distributed across Zerodha, Dhan, and other active execution environments.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
