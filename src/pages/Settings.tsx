import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MetricCard } from '../components/MetricCard';
import { User, Shield, CreditCard, Bell, Database } from 'lucide-react';

export function Settings() {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <h1 className="text-3xl font-sans font-bold tracking-tight mb-2">Alpha Settings</h1>
        <p className="text-text-secondary font-sans">Configure your terminal preferences and security parameters.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-2">
          {[
            { icon: User, label: 'Profile' },
            { icon: Shield, label: 'Security' },
            { icon: CreditCard, label: 'Brokerage' },
            { icon: Bell, label: 'Alerts' },
            { icon: Database, label: 'Data Hub' },
          ].map((item, idx) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${idx === 0 ? 'bg-bg-secondary text-text-primary border border-border-subtle' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </aside>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-bg-secondary border border-border-subtle p-8 rounded space-y-8">
            <section className="space-y-6">
              <h3 className="label-mono text-accent-gold">Identification Profile</h3>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-border-active flex items-center justify-center font-mono text-2xl border-2 border-accent-gold/20 overflow-hidden">
                   {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : user?.displayName?.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold font-sans">{user?.displayName}</p>
                  <p className="text-sm text-text-secondary font-mono">{user?.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] bg-accent-green/10 text-accent-green px-2 py-0.5 rounded border border-accent-green/20">VERIFIED ALPHA</span>
                    <span className="text-[10px] bg-bg-tertiary text-text-muted px-2 py-0.5 rounded border border-border-default">UID: {user?.uid.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-8 border-t border-border-subtle">
              <h3 className="label-mono text-accent-gold">Brokerage Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-muted uppercase">Default Broker</label>
                  <select className="w-full bg-bg-primary border border-border-default h-11 px-4 rounded focus:border-accent-gold outline-none text-sm">
                    <option>Zerodha / Kite</option>
                    <option>Upstox</option>
                    <option>Groww</option>
                    <option>Interactive Brokers</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-muted uppercase">Tax Residency</label>
                  <select className="w-full bg-bg-primary border border-border-default h-11 px-4 rounded focus:border-accent-gold outline-none text-sm">
                    <option>India (IST)</option>
                    <option>USA (EST)</option>
                    <option>UK (GMT)</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-8 border-t border-border-subtle">
              <h3 className="label-mono text-accent-gold">Data Protection</h3>
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded border border-border-default">
                <div>
                  <p className="text-sm font-bold font-sans">Cloud Sync Engine</p>
                  <p className="text-[11px] text-text-muted font-mono uppercase">Firestore Real-time Replication enabled</p>
                </div>
                <div className="w-10 h-5 bg-accent-green rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
