import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Clock, AlertTriangle, PackageOpen, Users, DollarSign } from 'lucide-react';
import api from '../utils/api';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const generateAiInsights = async () => {
    setLoadingAi(true);
    try {
      const res = await api.get('/intelligence/ai-insights');
      if (res.data.success) setAiInsights(res.data.insights);
    } catch (err) {
      alert('Failed to generate insights');
    } finally {
      setLoadingAi(false);
    }
  };

  if (!stats) return <div className="p-8 text-text-muted">Loading analytics...</div>;

  const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
    <div className="card border-t-2" style={{ borderTopColor: colorClass }}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-1">{title}</h3>
          <div className="text-3xl font-display font-bold text-text-main">{value}</div>
        </div>
        <div className={`p-2 rounded bg-secondary`} style={{ color: colorClass }}>
          <Icon size={20} />
        </div>
      </div>
      {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-accent-cyan" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-text-main">Management Analytics</h1>
            <p className="text-text-muted text-sm">Real-time overview of today's operations</p>
          </div>
        </div>
        <button onClick={loadStats} className="btn-outline text-sm py-1.5">Refresh Data</button>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`PKR ${stats.total_revenue || 0}`} icon={DollarSign} colorClass="#22D3EE" />
        <StatCard title="Completed Orders" value={stats.completed_orders || 0} icon={CheckCircle} colorClass="#4ADE80" />
        <StatCard title="Active Queue" value={stats.active_orders || 0} icon={Users} colorClass="#06B6D4" />
        <StatCard title="Avg Prep Time" value={`${stats.avg_preparation_time || 0}m`} icon={Clock} colorClass="#A855F7" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Delayed Orders" value={stats.delayed_orders || 0} icon={AlertTriangle} colorClass="#F59E0B" />
        <StatCard title="Cancelled Orders" value={stats.cancelled_orders || 0} icon={XCircle} colorClass="#F43F5E" />
        <div className="card p-4">
          <h3 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-2"><TrendingUp size={16} className="text-accent-cyan"/> Top 5 Most Ordered</h3>
          <ul className="space-y-2">
            {stats.top_5_ordered?.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center text-sm">
                <span className="text-text-main font-medium">{idx + 1}. {item.name}</span>
                <span className="text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">{item.qty}</span>
              </li>
            ))}
            {(!stats.top_5_ordered || stats.top_5_ordered.length === 0) && (
              <li className="text-sm text-text-muted">No orders today</li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Capacity Limits Control (UI Only for Hackathon) */}
      <div className="bg-primary border border-border p-5 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-md font-bold text-text-main flex items-center gap-2"><PackageOpen size={18} className="text-accent-neon"/> Order Capacity Limits</h3>
          <p className="text-xs text-text-muted mt-1">Maximum allowed orders per 15-minute pickup slot.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-main">Current Limit:</span>
          <span className="font-bold text-accent-neon bg-accent-neon/10 px-3 py-1 rounded">20 Orders / 15 min</span>
          <button className="btn-outline py-1.5 px-3 text-xs" onClick={() => alert('Capacity limits locked by Admin.')}>Adjust Limit</button>
        </div>
      </div>

      {/* Gemini AI Insights Section */}
      <div className="mt-12 bg-primary border border-accent-purple/30 rounded-xl p-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 to-transparent pointer-events-none"></div>
        <div className="bg-secondary rounded-lg p-6 relative z-10 border border-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              <span className="text-accent-purple">✨</span> Gemini AI Operations Intelligence
            </h2>
            <button 
              onClick={generateAiInsights}
              disabled={loadingAi}
              className="btn-primary bg-accent-purple hover:bg-purple-500 py-1.5 text-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              {loadingAi ? 'Analyzing Data...' : 'Generate Live Insights'}
            </button>
          </div>
          
          {aiInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded bg-primary border-l-2 border-accent-cyan">
                <div className="text-xs text-text-muted uppercase mb-1">Demand Forecast</div>
                <div className="text-sm text-text-main">{aiInsights.food_demand_prediction}</div>
              </div>
              <div className="p-4 rounded bg-primary border-l-2 border-accent-neon">
                <div className="text-xs text-text-muted uppercase mb-1">Peak Time Prediction</div>
                <div className="text-sm text-text-main">{aiInsights.peak_time_prediction}</div>
              </div>
              <div className="p-4 rounded bg-primary border-l-2 border-accent-purple">
                <div className="text-xs text-text-muted uppercase mb-1">Kitchen Workload</div>
                <div className="text-sm text-text-main">{aiInsights.order_delay_prediction}</div>
              </div>
              <div className="col-span-full p-4 rounded bg-accent-purple/10 border border-accent-purple/30 text-center mt-2">
                <div className="font-medium text-text-main">"{aiInsights.sales_insights}"</div>
              </div>
              
              <div className="col-span-full mt-6 p-4 rounded bg-primary border border-border">
                <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                  <span className="text-accent-purple">📊</span> Projected Demand Volume (Next 3 Hours)
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-text-main mb-1">
                      <span>Chocolate Brownie</span>
                      <span className="text-text-muted">High Demand (85%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 border border-border overflow-hidden">
                      <div className="bg-accent-cyan h-full rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-text-main mb-1">
                      <span>Classic Burger</span>
                      <span className="text-text-muted">Moderate Demand (45%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 border border-border overflow-hidden">
                      <div className="bg-accent-neon h-full rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-text-main mb-1">
                      <span>Veggie Bowl</span>
                      <span className="text-text-muted">Low Demand (15%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 border border-border overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-text-muted border border-dashed border-border rounded">
              Click generate to run predictive models on today's sales data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick icons
const CheckCircle = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XCircle = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
