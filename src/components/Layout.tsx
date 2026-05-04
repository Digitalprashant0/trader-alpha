import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Navigate } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-bg-primary flex flex-col items-center justify-center">
        <div className="text-accent-gold text-4xl font-mono animate-pulse mb-4">⟡</div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
