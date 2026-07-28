import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Briefcase, Layers, ListOrdered, RefreshCw, AlertCircle,
  TrendingUp, TrendingDown, ShieldCheck, PieChart, Filter
} from 'lucide-react';
import { getFunds, getHoldings, getPositions, getOrders } from '../services/accountService';

// Helper formatting utilities
const formatINR = (amount) =>
  typeof amount === 'number'
    ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '₹0.00';

const PnlBadge = ({ amount }) => {
  const isPositive = amount >= 0;
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold text-xs px-2 py-0.5 rounded-full ${
      isPositive
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    }`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {formatINR(amount)}
    </span>
  );
};

const SideBadge = ({ side }) => {
  const isBuy = side?.toUpperCase() === 'BUY';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
      isBuy
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
    }`}>
      {side}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'UNKNOWN';
  let styles = 'bg-slate-800 text-slate-400 border-slate-700';

  if (s === 'FILLED' || s === 'COMPLETE' || s === 'SUCCESS') {
    styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (s === 'REJECTED' || s === 'CANCELLED' || s === 'FAILED') {
    styles = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  } else if (s === 'PENDING' || s === 'TRANSIT' || s === 'OPEN') {
    styles = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }

  return (
    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${styles}`}>
      {s}
    </span>
  );
};

export default function PortfolioPage({ isFyersAuthenticated, activeSection = 'portfolio' }) {
  const [funds, setFunds] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);

  // Sub-tab selection state: 'all' | 'funds' | 'holdings' | 'positions' | 'orders'
  const [subTab, setSubTab] = useState(activeSection === 'orders' ? 'orders' : 'all');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync subTab whenever activeSection prop changes from sidebar navigation
  useEffect(() => {
    if (activeSection === 'orders') {
      setSubTab('orders');
    } else if (activeSection === 'portfolio' && subTab === 'orders') {
      setSubTab('all');
    }
  }, [activeSection]);

  const fetchAccountData = useCallback(async () => {
    if (!isFyersAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const [fundsData, holdingsData, positionsData, ordersData] = await Promise.allSettled([
        getFunds(),
        getHoldings(),
        getPositions(),
        getOrders(),
      ]);

      if (fundsData.status === 'fulfilled') setFunds(fundsData.value);
      if (holdingsData.status === 'fulfilled') setHoldings(holdingsData.value.data || []);
      if (positionsData.status === 'fulfilled') setPositions(positionsData.value.data || []);
      if (ordersData.status === 'fulfilled') setOrders(ordersData.value.data || []);

      const failed = [fundsData, holdingsData, positionsData, ordersData].filter(r => r.status === 'rejected');
      if (failed.length === 4) {
        setError(failed[0].reason?.response?.data?.detail || 'Failed to connect to FYERS account API.');
      }
    } catch (e) {
      setError(e.message || 'An error occurred fetching account data.');
    } finally {
      setLoading(false);
    }
  }, [isFyersAuthenticated]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  if (!isFyersAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <p className="text-base font-semibold text-white">FYERS Not Connected</p>
        <p className="text-sm text-center max-w-md">
          Please click <span className="text-emerald-400 font-semibold">Connect FYERS</span> in the top navigation bar to authenticate and view your account information.
        </p>
      </div>
    );
  }

  const showFunds = subTab === 'all' || subTab === 'funds';
  const showHoldings = subTab === 'all' || subTab === 'holdings';
  const showPositions = subTab === 'all' || subTab === 'positions';
  const showOrders = subTab === 'all' || subTab === 'orders';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {activeSection === 'orders' ? 'Order Book History' : 'Portfolio & Account Funds'}
            </h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
              Live Sync
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {activeSection === 'orders'
              ? 'Real-time order status, execution logs, and trade history.'
              : 'Read-only account balances, stock holdings, net positions, and fund limits.'}
          </p>
        </div>

        <button
          onClick={fetchAccountData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
            bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20
            disabled:opacity-50 active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Account Data'}</span>
        </button>
      </div>

      {/* Interactive Sub-Tab Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#151923] border border-[#232936] overflow-x-auto">
        <button
          onClick={() => setSubTab('all')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            subTab === 'all'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1E2433]'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>All Overview</span>
        </button>

        <button
          onClick={() => setSubTab('funds')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            subTab === 'funds'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1E2433]'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Funds &amp; Margins</span>
        </button>

        <button
          onClick={() => setSubTab('holdings')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            subTab === 'holdings'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1E2433]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Holdings ({holdings.length})</span>
        </button>

        <button
          onClick={() => setSubTab('positions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            subTab === 'positions'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1E2433]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Net Positions ({positions.length})</span>
        </button>

        <button
          onClick={() => setSubTab('orders')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            subTab === 'orders'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1E2433]'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Order Book ({orders.length})</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Funds Summary */}
      {showFunds && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#151923] border border-[#232936] space-y-2 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Available Balance</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {funds ? formatINR(funds.available_balance) : '—'}
            </div>
            <p className="text-[11px] text-slate-500">Margin available for trading</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151923] border border-[#232936] space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Utilized Balance</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {funds ? formatINR(funds.utilized_balance) : '—'}
            </div>
            <p className="text-[11px] text-slate-500">Margin deployed in active positions</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151923] border border-[#232936] space-y-2 shadow-lg col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Account Status</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm font-semibold text-white">FYERS OAuth Active</span>
            </div>
            <p className="text-[11px] text-slate-500">Read-Only Session Validated</p>
          </div>
        </div>
      )}

      {/* SECTION 2: Holdings */}
      {showHoldings && (
        <div className="rounded-2xl bg-[#151923] border border-[#232936] overflow-hidden shadow-lg">
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">Equity Holdings</h2>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-[#0B0E14] px-2.5 py-1 rounded-lg border border-[#232936]">
              {holdings.length} Positions
            </span>
          </div>

          <div className="p-5">
            {holdings.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No holdings found in your FYERS account.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#232936]">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-[#0B0E14] text-slate-400 border-b border-[#232936]">
                      <th className="px-4 py-3 text-left font-semibold">Symbol</th>
                      <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                      <th className="px-4 py-3 text-right font-semibold">Avg Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Current Value</th>
                      <th className="px-4 py-3 text-right font-semibold">P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h, i) => (
                      <tr key={i} className="border-b border-[#232936]/50 hover:bg-[#1E2433]/50 transition-colors">
                        <td className="px-4 py-3 text-slate-200 font-semibold">{h.symbol}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{h.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{formatINR(h.cost_price)}</td>
                        <td className="px-4 py-3 text-right text-white font-semibold">{formatINR(h.current_value)}</td>
                        <td className="px-4 py-3 text-right">
                          <PnlBadge amount={h.pnl} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: Positions */}
      {showPositions && (
        <div className="rounded-2xl bg-[#151923] border border-[#232936] overflow-hidden shadow-lg">
          <div className="px-5 py-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-b border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white text-base">Net Positions</h2>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-[#0B0E14] px-2.5 py-1 rounded-lg border border-[#232936]">
              {positions.length} Active
            </span>
          </div>

          <div className="p-5">
            {positions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No open or closed positions found for today.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#232936]">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-[#0B0E14] text-slate-400 border-b border-[#232936]">
                      <th className="px-4 py-3 text-left font-semibold">Symbol</th>
                      <th className="px-4 py-3 text-center font-semibold">Side</th>
                      <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                      <th className="px-4 py-3 text-right font-semibold">Avg Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Current Price</th>
                      <th className="px-4 py-3 text-right font-semibold">P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p, i) => (
                      <tr key={i} className="border-b border-[#232936]/50 hover:bg-[#1E2433]/50 transition-colors">
                        <td className="px-4 py-3 text-slate-200 font-semibold">{p.symbol}</td>
                        <td className="px-4 py-3 text-center"><SideBadge side={p.side} /></td>
                        <td className="px-4 py-3 text-right text-slate-300">{p.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{formatINR(p.avg_price)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{formatINR(p.current_price)}</td>
                        <td className="px-4 py-3 text-right">
                          <PnlBadge amount={p.pnl} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: Order Book */}
      {showOrders && (
        <div className="rounded-2xl bg-[#151923] border border-[#232936] overflow-hidden shadow-lg">
          <div className="px-5 py-4 bg-gradient-to-r from-violet-500/10 to-purple-500/5 border-b border-violet-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ListOrdered className="w-5 h-5 text-violet-400" />
              <h2 className="font-bold text-white text-base">Order Book History</h2>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-[#0B0E14] px-2.5 py-1 rounded-lg border border-[#232936]">
              {orders.length} Orders
            </span>
          </div>

          <div className="p-5">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No orders found in order book.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#232936]">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-[#0B0E14] text-slate-400 border-b border-[#232936]">
                      <th className="px-4 py-3 text-left font-semibold">Order ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Symbol</th>
                      <th className="px-4 py-3 text-center font-semibold">Side</th>
                      <th className="px-4 py-3 text-right font-semibold">Qty</th>
                      <th className="px-4 py-3 text-center font-semibold">Type</th>
                      <th className="px-4 py-3 text-center font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={i} className="border-b border-[#232936]/50 hover:bg-[#1E2433]/50 transition-colors">
                        <td className="px-4 py-3 text-slate-400">{o.order_id}</td>
                        <td className="px-4 py-3 text-slate-200 font-semibold">{o.symbol}</td>
                        <td className="px-4 py-3 text-center"><SideBadge side={o.side} /></td>
                        <td className="px-4 py-3 text-right text-slate-300">{o.quantity}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{o.order_type}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={o.status} /></td>
                        <td className="px-4 py-3 text-right text-slate-400">{o.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
