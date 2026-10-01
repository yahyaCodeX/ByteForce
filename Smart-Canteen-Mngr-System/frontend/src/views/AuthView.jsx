import React, { useState } from 'react';
import { LogIn, User, ChefHat, LayoutDashboard, Shield } from 'lucide-react';
import api from '../utils/api';

const DEMO_ACCOUNTS = [
  { role: 'CUSTOMER', email: 'customer@demo.com', password: 'demo123', icon: User, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  { role: 'STAFF', email: 'staff@demo.com', password: 'demo123', icon: ChefHat, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
  { role: 'MANAGER', email: 'manager@demo.com', password: 'demo123', icon: LayoutDashboard, color: 'text-accent-neon', bg: 'bg-accent-neon/10' },
  { role: 'ADMIN', email: 'admin@demo.com', password: 'demo123', icon: Shield, color: 'text-text-main', bg: 'bg-white/10' }
];

export default function AuthView({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = async (account) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email: account.email, password: account.password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      } else {
        setError(res.data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Server error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm pointer-events-none"></div>
      
      <div className="card w-full max-w-md z-10 border-border/50 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-cyan/10 text-accent-cyan mb-4">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text-main mb-2">Smart Canteen OS</h1>
          <p className="text-sm text-text-muted">Select a demo persona to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.role}
                onClick={() => handleDemoLogin(acc)}
                disabled={loading}
                className={`w-full flex items-center gap-4 p-4 rounded border border-border/50 hover:border-border transition-all group ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-secondary/80 active:scale-[0.98]'}`}
              >
                <div className={`w-10 h-10 rounded flex items-center justify-center ${acc.bg} ${acc.color}`}>
                  <Icon size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-text-main group-hover:text-white transition-colors">{acc.role}</div>
                  <div className="text-xs text-text-muted">{acc.email}</div>
                </div>
                <div className="text-border group-hover:text-accent-cyan transition-colors">
                  &rarr;
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
