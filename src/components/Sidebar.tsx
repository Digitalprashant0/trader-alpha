import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListOrdered, 
  PlusCircle, 
  Wallet, 
  BarChart3, 
  MessageSquareCode, 
  IndianRupee,
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const { logOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ListOrdered, label: 'Trade Log', path: '/trades' },
    { icon: PlusCircle, label: 'Add Trade', path: '/add-trade' },
    { icon: Wallet, label: 'Portfolio', path: '/portfolio' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: IndianRupee, label: 'Funds', path: '/funds' },
  ];

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-bg-secondary/50 backdrop-blur-xl border-r border-border-subtle flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-accent-gold text-2xl font-mono drop-shadow-sm">⟡</span>
            <span className="font-sans font-bold tracking-tighter text-base text-text-primary">TRADING ALPHA</span>
          </div>
        )}
        {collapsed && (
          <span className="text-accent-gold text-2xl font-mono mx-auto drop-shadow-sm">⟡</span>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
              isActive 
                ? "bg-white text-text-primary shadow-sm border border-border-default font-semibold" 
                : "text-text-secondary hover:bg-white/50 hover:text-text-primary"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={cn("min-w-[18px] transition-transform group-hover:scale-105", isActive ? "text-accent-gold" : "text-text-muted group-hover:text-text-primary")} />
                {!collapsed && <span className="text-sm">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-bg-elevated border border-border-default rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border-subtle space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded transition-all group relative",
            isActive 
              ? "bg-bg-secondary text-text-primary" 
              : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          )}
        >
          <Settings size={20} className="min-w-[20px]" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-text-secondary hover:bg-bg-tertiary hover:text-accent-red transition-all group relative"
        >
          <LogOut size={20} className="min-w-[20px]" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-20 -right-3 w-6 h-6 bg-border-default border border-border-active rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
