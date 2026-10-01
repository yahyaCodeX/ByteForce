import React, { useState, useEffect } from 'react';
import { ChefHat, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../utils/api';

export default function KitchenPortal() {
  const [queue, setQueue] = useState({ PREPARING: [], ACCEPTED: [], PLACED: [], READY: [] });
  const [verifyTokenStr, setVerifyTokenStr] = useState('');
  
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const res = await api.get('/queue/live');
      if (res.data.success) {
        // Group by status
        const grouped = { PREPARING: [], ACCEPTED: [], PLACED: [], READY: [] };
        res.data.queue.forEach(item => {
          if (grouped[item.order_status]) {
            grouped[item.order_status].push(item);
          }
        });
        setQueue(grouped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      loadQueue();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    if (!verifyTokenStr.trim()) return;
    try {
      const res = await api.post('/orders/verify-token', { token_number: verifyTokenStr });
      if (res.data.success) {
        alert(res.data.message);
        setVerifyTokenStr('');
        loadQueue();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Verification failed');
    }
  };

  const OrderCard = ({ order }) => {
    const isDelayed = order.is_delayed;
    
    return (
      <div className={`card p-4 border-l-4 ${isDelayed ? 'border-accent-purple bg-accent-purple/5' : 'border-border'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-display font-bold text-text-main">{order.token_number}</span>
            {isDelayed && <span className="flex items-center gap-1 text-xs text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded"><AlertTriangle size={12}/> Delayed</span>}
          </div>
          <div className="text-right text-xs text-text-muted">
            {new Date(order.order_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        
        <div className="space-y-2 mb-4 text-sm text-text-main">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between pb-1 border-b border-border/30 last:border-0">
              <span><span className="text-accent-cyan font-bold mr-1">{item.quantity}x</span> {item.item_name}</span>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
          {order.order_status === 'PLACED' && (
            <button onClick={() => updateStatus(order.order_id, 'ACCEPTED')} className="btn-outline flex-1 py-1.5 text-xs border-accent-cyan text-accent-cyan">Accept</button>
          )}
          {order.order_status === 'ACCEPTED' && (
            <button onClick={() => updateStatus(order.order_id, 'PREPARING')} className="btn-outline flex-1 py-1.5 text-xs border-accent-neon text-accent-neon">Start Prep</button>
          )}
          {order.order_status === 'PREPARING' && (
            <button onClick={() => updateStatus(order.order_id, 'READY')} className="btn-primary flex-1 py-1.5 text-xs flex justify-center items-center gap-1"><CheckCircle size={14}/> Mark Ready</button>
          )}
          {order.order_status === 'READY' && (
            <div className="text-center w-full text-xs text-text-muted">Awaiting Customer Collection...</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <ChefHat className="text-accent-purple" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-text-main">Live Kitchen Queue</h1>
            <p className="text-text-muted text-sm">Real-time order synchronization</p>
          </div>
        </div>
        
        <form onSubmit={handleVerifyToken} className="flex items-center gap-2 bg-secondary p-2 rounded-lg border border-border">
          <input 
            type="text" 
            placeholder="Enter Token (e.g. C-023)" 
            className="input-field py-1.5 px-3 text-sm w-48 uppercase"
            value={verifyTokenStr}
            onChange={(e) => setVerifyTokenStr(e.target.value.toUpperCase())}
          />
          <button type="submit" className="btn-primary py-1.5 px-4 text-sm font-semibold">
            Verify & Collect
          </button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Placed Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-primary p-3 rounded border border-border">
            <h2 className="font-semibold text-text-muted uppercase text-xs tracking-wider">New (Placed)</h2>
            <span className="bg-secondary px-2 py-0.5 rounded text-xs text-text-main font-bold">{queue.PLACED.length}</span>
          </div>
          {queue.PLACED.map(order => <OrderCard key={order.order_id} order={order} />)}
          {queue.PLACED.length === 0 && <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border rounded">No new orders</div>}
        </div>
        
        {/* Accepted Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-primary p-3 rounded border border-accent-cyan/30">
            <h2 className="font-semibold text-accent-cyan uppercase text-xs tracking-wider">Accepted / Queue</h2>
            <span className="bg-accent-cyan/10 px-2 py-0.5 rounded text-xs text-accent-cyan font-bold">{queue.ACCEPTED.length}</span>
          </div>
          {queue.ACCEPTED.map(order => <OrderCard key={order.order_id} order={order} />)}
          {queue.ACCEPTED.length === 0 && <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border rounded">Queue empty</div>}
        </div>
        
        {/* Preparing Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-primary p-3 rounded border border-accent-neon/30">
            <h2 className="font-semibold text-accent-neon uppercase text-xs tracking-wider">Currently Preparing</h2>
            <span className="bg-accent-neon/10 px-2 py-0.5 rounded text-xs text-accent-neon font-bold">{queue.PREPARING.length}</span>
          </div>
          {queue.PREPARING.map(order => <OrderCard key={order.order_id} order={order} />)}
          {queue.PREPARING.length === 0 && <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border rounded">Kitchen is clear</div>}
        </div>
        
        {/* Ready Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-primary p-3 rounded border border-green-500/30">
            <h2 className="font-semibold text-green-500 uppercase text-xs tracking-wider">Ready for Pickup</h2>
            <span className="bg-green-500/10 px-2 py-0.5 rounded text-xs text-green-500 font-bold">{queue.READY.length}</span>
          </div>
          {queue.READY.map(order => <OrderCard key={order.order_id} order={order} />)}
          {queue.READY.length === 0 && <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border rounded">No ready orders</div>}
        </div>
      </div>
    </div>
  );
}
