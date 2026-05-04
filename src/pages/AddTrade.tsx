import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { calculateCharges } from '../lib/charges';
import { calculateTradePnL } from '../lib/calculations';
import { formatCurrency } from '../lib/formatters';
import { cn } from '../lib/utils';
import { Save, Calculator, AlertCircle, Loader2 } from 'lucide-react';

export function AddTrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    symbol: '',
    type: 'BUY' as 'BUY' | 'SELL',
    instrumentType: 'Equity',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: '',
    setup: 'Breakout',
    notes: '',
    tags: '',
  });

  const entryPrice = parseFloat(formData.entryPrice) || 0;
  const exitPrice = parseFloat(formData.exitPrice) || 0;
  const quantity = parseFloat(formData.quantity) || 0;

  const chargeSnapshot = calculateCharges({
    type: formData.type,
    symbol: formData.symbol,
    entryPrice,
    exitPrice: exitPrice || entryPrice,
    quantity,
    isFutures: formData.instrumentType === 'Futures',
    isOptions: formData.instrumentType === 'Options',
  });

  const pnlSnapshot = calculateTradePnL({
    type: formData.type,
    entryPrice,
    exitPrice: exitPrice || undefined,
    quantity,
    charges: chargeSnapshot.total,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const tradeData = {
        symbol: formData.symbol.toUpperCase(),
        type: formData.type,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
        quantity: parseFloat(formData.quantity),
        entryTime: new Date(formData.entryTime),
        exitTime: formData.exitTime ? new Date(formData.exitTime) : null,
        setup: formData.setup,
        notes: formData.notes,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        charges: chargeSnapshot.total,
        grossPnL: pnlSnapshot.gross,
        netPnL: pnlSnapshot.net,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'users', user.uid, 'trades'), tradeData);
      navigate('/trades');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <h1 className="text-3xl font-sans font-bold tracking-tight mb-2">New Engagement</h1>
        <p className="text-text-secondary font-sans">Initialize a new trade log with execution parameters.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-white p-8 border border-border-subtle rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Symbol / Ticker</label>
              <input
                required
                type="text"
                placeholder="e.g. RELIANCE"
                className="w-full bg-bg-secondary/50 border border-border-subtle h-12 px-4 rounded-xl focus:border-accent-gold focus:bg-white outline-none transition-all font-mono text-sm placeholder:text-text-muted/50"
                value={formData.symbol}
                onChange={e => setFormData({ ...formData, symbol: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Instrument Type</label>
              <select
                className="w-full bg-bg-secondary/50 border border-border-subtle h-12 px-4 rounded-xl focus:border-accent-gold focus:bg-white outline-none transition-all font-sans text-sm"
                value={formData.instrumentType}
                onChange={e => setFormData({ ...formData, instrumentType: e.target.value })}
              >
                <option>Equity</option>
                <option>Futures</option>
                <option>Options</option>
                <option>Crypto</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Execution Side</label>
              <div className="flex gap-2 p-1 bg-bg-secondary/50 rounded-2xl border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'BUY' })}
                  className={cn(
                    "flex-1 h-10 rounded-xl font-bold transition-all text-sm",
                    formData.type === 'BUY' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'SELL' })}
                  className={cn(
                    "flex-1 h-10 rounded-xl font-bold transition-all text-sm",
                    formData.type === 'SELL' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  SELL
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Setup Protocol</label>
              <select
                className="w-full bg-bg-secondary/50 border border-border-subtle h-12 px-4 rounded-xl focus:border-accent-gold focus:bg-white outline-none transition-all font-sans text-sm"
                value={formData.setup}
                onChange={e => setFormData({ ...formData, setup: e.target.value })}
              >
                <option>Breakout</option>
                <option>Reversal</option>
                <option>Momentum</option>
                <option>Scalp</option>
                <option>Swing</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Quantities / Lots</label>
              <input
                required
                type="number"
                className="w-full bg-bg-secondary/50 border border-border-subtle h-12 px-4 rounded-xl focus:border-accent-gold focus:bg-white outline-none transition-all font-mono text-sm"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Entry Price</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full bg-bg-secondary/50 border border-border-subtle h-12 px-4 rounded-xl focus:border-accent-gold focus:bg-white outline-none transition-all font-mono text-sm"
                value={formData.entryPrice}
                onChange={e => setFormData({ ...formData, entryPrice: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Entry Timestamp</label>
              <input
                required
                type="datetime-local"
                className="w-full bg-bg-secondary/50 border border-border-subtle h-12 px-4 rounded-xl focus:border-accent-gold focus:bg-white outline-none transition-all font-mono text-xs"
                value={formData.entryTime}
                onChange={e => setFormData({ ...formData, entryTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Exit Price (Optional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Live/Open"
                className="w-full bg-bg-secondary/50 border border-border-subtle h-12 px-4 rounded-xl focus:border-accent-gold focus:bg-white outline-none transition-all font-mono text-sm"
                value={formData.exitPrice}
                onChange={e => setFormData({ ...formData, exitPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="label-mono text-[10px] text-text-muted uppercase tracking-widest px-1">Debrief Notes</label>
            <textarea
              className="w-full bg-bg-secondary/50 border border-border-subtle p-4 rounded-2xl focus:border-accent-gold focus:bg-white outline-none transition-all min-h-[120px] resize-none font-sans text-sm"
              placeholder="Record your mental state and execution quality..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 h-12 rounded-xl text-text-secondary font-semibold hover:bg-bg-secondary transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-text-primary text-white font-bold px-10 h-12 rounded-xl hover:bg-black active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-black/10 cursor-pointer"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Log Execution
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="metric-card bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-none">
            <p className="label-mono mb-6 text-accent-gold flex items-center gap-2">
              <Calculator size={14} /> Execution Preview
            </p>
              <div className="flex justify-between items-center pb-2 border-b border-border-default">
                <span className="text-text-muted text-xs font-mono uppercase">Gross Result</span>
                <span className={cn("font-mono", pnlSnapshot.gross >= 0 ? "text-accent-green" : "text-accent-red")}>
                  {formatCurrency(pnlSnapshot.gross)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-default">
                <span className="text-text-muted text-xs font-mono uppercase">Est. Charges</span>
                <span className="text-accent-red font-mono">-{formatCurrency(chargeSnapshot.total)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-text-primary text-sm font-sans font-bold">Net P&L</span>
                <span className={cn("text-xl font-mono font-bold", pnlSnapshot.net >= 0 ? "text-accent-green" : "text-accent-red")}>
                  {formatCurrency(pnlSnapshot.net)}
                </span>
              </div>
            </div>

            <div className="metric-card border-dashed">
              <p className="label-mono mb-3">Charge Breakdown</p>
              <div className="space-y-2 text-[11px] font-mono">
                <div className="flex justify-between text-text-secondary">
                  <span>Brokerage</span>
                  <span>{formatCurrency(chargeSnapshot.breakdown.brokerage)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>STT/CTT</span>
                  <span>{formatCurrency(chargeSnapshot.breakdown.stt)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>GST (18%)</span>
                  <span>{formatCurrency(chargeSnapshot.breakdown.gst)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Exchange/SEBI</span>
                  <span>{formatCurrency(chargeSnapshot.breakdown.exchangeTxn + chargeSnapshot.breakdown.sebi)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
