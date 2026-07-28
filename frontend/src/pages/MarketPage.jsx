import React, { useState, useCallback } from 'react';
import {
  Search, RefreshCw, TrendingUp, BarChart2, BookOpen, Layers,
  ArrowUp, ArrowDown, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import { getLtp, getLtpMultiple, getHistory, getDepth } from '../services/marketService';
import { HistoricalChart } from '../components/HistoricalChart';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

const formatPrice = (price) =>
  typeof price === 'number' ? price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—';

const formatTimestamp = (ts) => {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ErrorBanner = ({ message }) => (
  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
    <span>{message}</span>
  </div>
);

const SectionCard = ({ title, icon: Icon, accent = 'emerald', children }) => {
  const accents = {
    emerald: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-400',
    blue: 'from-blue-500/10 to-cyan-500/5 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/10 to-yellow-500/5 border-amber-500/20 text-amber-400',
    violet: 'from-violet-500/10 to-purple-500/5 border-violet-500/20 text-violet-400',
  };

  return (
    <div className="rounded-2xl bg-[#151923] border border-[#232936] overflow-hidden shadow-lg">
      <div className={`px-5 py-4 bg-gradient-to-r border-b ${accents[accent]}`}>
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5" />
          <h2 className="font-bold text-white text-base">{title}</h2>
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
};

const InputRow = ({ children }) => (
  <div className="flex flex-wrap gap-3 items-end">{children}</div>
);

const FieldGroup = ({ label, children, className = '' }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs text-slate-400 font-medium">{label}</label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, className = '' }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`bg-[#0B0E14] border border-[#232936] text-slate-200 placeholder-slate-600
      text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50
      focus:ring-1 focus:ring-emerald-500/20 transition-all ${className}`}
  />
);

const SelectInput = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-[#0B0E14] border border-[#232936] text-slate-200 text-sm rounded-xl
      px-3 py-2 focus:outline-none focus:border-emerald-500/50 focus:ring-1
      focus:ring-emerald-500/20 transition-all"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const ActionButton = ({ onClick, disabled, loading, children, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
      transition-all active:scale-95 disabled:opacity-50
      bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20
      ${className}`}
  >
    {loading
      ? <Loader2 className="w-4 h-4 animate-spin" />
      : children}
  </button>
);

// ---------------------------------------------------------------------------
// Section 1: Single Symbol LTP
// ---------------------------------------------------------------------------
const LtpSection = () => {
  const [symbol, setSymbol] = useState('NSE:SBIN-EQ');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = useCallback(async () => {
    if (!symbol.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await getLtp(symbol.trim().toUpperCase());
      setResult(data.data[0] || null);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to fetch LTP.');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  return (
    <SectionCard title="Single Symbol LTP" icon={TrendingUp} accent="emerald">
      <InputRow>
        <FieldGroup label="Symbol" className="flex-1 min-w-[180px]">
          <TextInput value={symbol} onChange={setSymbol} placeholder="NSE:SBIN-EQ" />
        </FieldGroup>
        <ActionButton onClick={handleFetch} loading={loading}>
          <Search className="w-4 h-4" />
          Fetch LTP
        </ActionButton>
      </InputRow>

      {error && <ErrorBanner message={error} />}

      {result && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0B0E14] border border-[#232936]">
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-mono">{result.symbol}</p>
            <p className="text-3xl font-bold font-mono text-emerald-400 mt-1">
              ₹{formatPrice(result.ltp)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20
            flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      )}
    </SectionCard>
  );
};

// ---------------------------------------------------------------------------
// Section 2: Top 10 Watchlist
// ---------------------------------------------------------------------------
const WatchlistSection = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const resp = await getLtpMultiple();
      setData(resp.data || []);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to fetch watchlist.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SectionCard title="Top 10 Watchlist" icon={BarChart2} accent="blue">
      <ActionButton onClick={handleFetch} loading={loading} className="bg-blue-600 hover:bg-blue-500 shadow-blue-600/20">
        <RefreshCw className="w-4 h-4" />
        Refresh Prices
      </ActionButton>

      {error && <ErrorBanner message={error} />}

      {data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {data.map((item) => {
            const name = item.symbol.split(':')[1]?.replace('-EQ', '') || item.symbol;
            return (
              <div key={item.symbol}
                className="p-3 rounded-xl bg-[#0B0E14] border border-[#232936] space-y-1
                  hover:border-blue-500/30 transition-all">
                <p className="text-xs font-mono text-slate-400 truncate">{item.symbol}</p>
                <p className="text-sm font-bold text-slate-200">{name}</p>
                <p className="text-lg font-bold font-mono text-blue-400">₹{formatPrice(item.ltp)}</p>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

// ---------------------------------------------------------------------------
// Section 3: Historical Candle Data
// ---------------------------------------------------------------------------
const RESOLUTION_OPTIONS = [
  { value: 'D', label: 'Daily' },
  { value: 'W', label: 'Weekly' },
  { value: 'M', label: 'Monthly' },
  { value: '60', label: '60 min' },
  { value: '30', label: '30 min' },
  { value: '15', label: '15 min' },
  { value: '5', label: '5 min' },
  { value: '1', label: '1 min' },
];

const toEpoch = (dateStr) => Math.floor(new Date(dateStr).getTime() / 1000);

const HistorySection = () => {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [symbol, setSymbol] = useState('NSE:SBIN-EQ');
  const [resolution, setResolution] = useState('D');
  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = useCallback(async () => {
    if (!symbol.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await getHistory(
        symbol.trim().toUpperCase(),
        resolution,
        toEpoch(dateFrom),
        toEpoch(dateTo),
      );
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to fetch history.');
    } finally {
      setLoading(false);
    }
  }, [symbol, resolution, dateFrom, dateTo]);

  return (
    <SectionCard title="Historical Candle Data" icon={BookOpen} accent="amber">
      <InputRow>
        <FieldGroup label="Symbol" className="flex-1 min-w-[160px]">
          <TextInput value={symbol} onChange={setSymbol} placeholder="NSE:SBIN-EQ" />
        </FieldGroup>
        <FieldGroup label="Resolution">
          <SelectInput value={resolution} onChange={setResolution} options={RESOLUTION_OPTIONS} />
        </FieldGroup>
        <FieldGroup label="From Date">
          <TextInput value={dateFrom} onChange={setDateFrom} placeholder="YYYY-MM-DD" />
        </FieldGroup>
        <FieldGroup label="To Date">
          <TextInput value={dateTo} onChange={setDateTo} placeholder="YYYY-MM-DD" />
        </FieldGroup>
        <ActionButton onClick={handleFetch} loading={loading}
          className="bg-amber-600 hover:bg-amber-500 shadow-amber-600/20">
          <ChevronRight className="w-4 h-4" />
          Fetch Data
        </ActionButton>
      </InputRow>

      {error && <ErrorBanner message={error} />}

      {result && result.candles.length > 0 && (
        <div className="space-y-6">
          {/* TradingView Candlestick Chart */}
          <HistoricalChart
            candles={result.candles}
            symbol={result.symbol}
            resolution={result.resolution}
          />

          {/* OHLC Table Header & Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">OHLC Data Table · {result.symbol}</span>
              <span>{result.candles.length} candles</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#232936]">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-[#0B0E14] text-slate-400 border-b border-[#232936]">
                  {['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.candles.slice(0, 100).map((c, i) => (
                  <tr key={i}
                    className="border-b border-[#232936]/50 hover:bg-[#1E2433]/50 transition-colors">
                    <td className="px-3 py-2 text-slate-400">{formatTimestamp(c.timestamp)}</td>
                    <td className="px-3 py-2 text-slate-200">{formatPrice(c.open)}</td>
                    <td className="px-3 py-2 text-emerald-400">{formatPrice(c.high)}</td>
                    <td className="px-3 py-2 text-rose-400">{formatPrice(c.low)}</td>
                    <td className="px-3 py-2 text-white font-semibold">{formatPrice(c.close)}</td>
                    <td className="px-3 py-2 text-slate-400">{c.volume.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.candles.length > 100 && (
              <p className="text-center text-xs text-slate-500 py-2">
                Showing first 100 of {result.candles.length} candles
              </p>
            )}
          </div>
        </div>
      </div>
    )}

      {result && result.candles.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">No candles returned for this range.</p>
      )}
    </SectionCard>
  );
};

// ---------------------------------------------------------------------------
// Section 4: Market Depth
// ---------------------------------------------------------------------------
const DepthSection = () => {
  const [symbol, setSymbol] = useState('NSE:SBIN-EQ');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = useCallback(async () => {
    if (!symbol.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await getDepth(symbol.trim().toUpperCase());
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to fetch depth.');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const DepthTable = ({ title, data, color }) => (
    <div className="flex-1 space-y-1.5">
      <p className={`text-xs font-bold uppercase tracking-widest ${color}`}>{title}</p>
      <div className="rounded-xl border border-[#232936] overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-[#0B0E14] text-slate-500 border-b border-[#232936]">
              <th className="px-3 py-2 text-left">Orders</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0
              ? <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-600">No data</td></tr>
              : data.map((level, i) => (
                <tr key={i} className="border-b border-[#232936]/50 hover:bg-[#1E2433]/50">
                  <td className="px-3 py-1.5 text-slate-400">{level.orders}</td>
                  <td className="px-3 py-1.5 text-right text-slate-300">{level.quantity.toLocaleString()}</td>
                  <td className={`px-3 py-1.5 text-right font-semibold ${color}`}>
                    {formatPrice(level.price)}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <SectionCard title="Market Depth (Level 2)" icon={Layers} accent="violet">
      <InputRow>
        <FieldGroup label="Symbol" className="flex-1 min-w-[180px]">
          <TextInput value={symbol} onChange={setSymbol} placeholder="NSE:SBIN-EQ" />
        </FieldGroup>
        <ActionButton onClick={handleFetch} loading={loading}
          className="bg-violet-600 hover:bg-violet-500 shadow-violet-600/20">
          <Search className="w-4 h-4" />
          Fetch Depth
        </ActionButton>
      </InputRow>

      {error && <ErrorBanner message={error} />}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-[#0B0E14] border border-[#232936]">
            <p className="text-xs text-slate-400 font-mono flex-1">{result.symbol}</p>
            <p className="text-lg font-bold font-mono text-white">LTP: ₹{formatPrice(result.ltp)}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <DepthTable title="Bids (Buy)" data={result.bids} color="text-emerald-400" />
            <DepthTable title="Asks (Sell)" data={result.asks} color="text-rose-400" />
          </div>
        </div>
      )}
    </SectionCard>
  );
};

// ---------------------------------------------------------------------------
// MarketPage root
// ---------------------------------------------------------------------------
export default function MarketPage({ isFyersAuthenticated }) {
  if (!isFyersAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <p className="text-base font-semibold text-white">FYERS Not Connected</p>
        <p className="text-sm text-center">
          Please click <span className="text-emerald-400 font-semibold">Connect FYERS</span> in the
          top navigation bar to authenticate before accessing market data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">Market Data</h1>
          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1
            rounded-full border border-emerald-500/20">
            Live
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Read-only market data powered by the FYERS API v3. LTP, historical candles, and market depth.
        </p>
      </div>

      <LtpSection />
      <WatchlistSection />
      <HistorySection />
      <DepthSection />
    </div>
  );
}
