import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, Radio, RefreshCw, Zap, TrendingUp, TrendingDown,
  Clock, AlertCircle, WifiOff,
} from 'lucide-react';

const REQUIRED_SYMBOLS = [
  "NSE:SBIN-EQ",
  "NSE:RELIANCE-EQ",
  "NSE:TCS-EQ",
  "NSE:INFY-EQ",
  "NSE:HDFCBANK-EQ",
];

const INITIAL_STATE = {
  "NSE:SBIN-EQ": { symbol: "NSE:SBIN-EQ", name: "State Bank of India", ltp: 845.50, prev_close: 845.50, change: 0.0, timestamp: "—", flash: null },
  "NSE:RELIANCE-EQ": { symbol: "NSE:RELIANCE-EQ", name: "Reliance Industries", ltp: 3020.10, prev_close: 3020.10, change: 0.0, timestamp: "—", flash: null },
  "NSE:TCS-EQ": { symbol: "NSE:TCS-EQ", name: "Tata Consultancy Services", ltp: 4210.75, prev_close: 4210.75, change: 0.0, timestamp: "—", flash: null },
  "NSE:INFY-EQ": { symbol: "NSE:INFY-EQ", name: "Infosys Limited", ltp: 1825.30, prev_close: 1825.30, change: 0.0, timestamp: "—", flash: null },
  "NSE:HDFCBANK-EQ": { symbol: "NSE:HDFCBANK-EQ", name: "HDFC Bank Limited", ltp: 1640.20, prev_close: 1640.20, change: 0.0, timestamp: "—", flash: null },
};

const formatPrice = (price) =>
  typeof price === 'number' ? price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

export default function MarketWatchPage({ isFyersAuthenticated }) {
  const [ticks, setTicks] = useState(INITIAL_STATE);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected'); // Connected | Connecting | Disconnected
  const [lastTickTime, setLastTickTime] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    // Prevent duplicate connections
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setConnectionStatus('Connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/market`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('Connected');
        console.log('[WebSocket] Connected to /ws/market');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.symbol) {
            const sym = data.symbol;
            const newPrice = data.ltp;
            const timeStr = data.timestamp || new Date().toLocaleTimeString();

            setTicks((prev) => {
              const current = prev[sym] || { symbol: sym, ltp: newPrice, prev_close: newPrice, change: 0 };
              const oldPrice = current.ltp;
              let flash = null;

              if (newPrice > oldPrice) flash = 'up';
              else if (newPrice < oldPrice) flash = 'down';

              return {
                ...prev,
                [sym]: {
                  ...current,
                  ltp: newPrice,
                  prev_close: data.prev_close || current.prev_close || newPrice,
                  change: data.change ?? (newPrice - (current.prev_close || newPrice)),
                  timestamp: timeStr,
                  flash: flash,
                },
              };
            });

            setLastTickTime(new Date());

            // Clear flash after 800ms
            setTimeout(() => {
              setTicks((prev) => {
                if (!prev[sym]) return prev;
                return {
                  ...prev,
                  [sym]: { ...prev[sym], flash: null },
                };
              });
            }, 800);
          }
        } catch (err) {
          console.error('[WebSocket] Message parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        setConnectionStatus('Disconnected');
      };

      ws.onclose = () => {
        setConnectionStatus('Disconnected');
        console.log('[WebSocket] Disconnected from /ws/market. Retrying in 3s...');
        // Auto-reconnect after 3s
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    } catch (e) {
      console.error('[WebSocket] Initialization error:', e);
      setConnectionStatus('Disconnected');
    }
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Live Market Watch</h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              WebSocket Live
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Real-time streaming market prices for Top 5 NSE Benchmark Stocks via FastAPI WebSockets.
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-md ${
            connectionStatus === 'Connected'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : connectionStatus === 'Connecting'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {connectionStatus === 'Connected' ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Connected to /ws/market</span>
              </>
            ) : connectionStatus === 'Connecting' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Disconnected</span>
              </>
            )}
          </div>

          <button
            onClick={() => {
              if (wsRef.current) wsRef.current.close();
              connectWebSocket();
            }}
            className="p-2 rounded-xl bg-[#151923] hover:bg-[#1E2433] border border-[#232936] text-slate-300 hover:text-white transition-all"
            title="Reconnect WebSocket"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Main Watchlist Table */}
      <div className="rounded-2xl bg-[#151923] border border-[#232936] overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-b border-[#232936] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white text-base">Live Stream (5 Core Symbols)</h2>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last Tick: {lastTickTime ? lastTickTime.toLocaleTimeString() : '—'}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto rounded-xl border border-[#232936]">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="bg-[#0B0E14] text-slate-400 border-b border-[#232936]">
                  <th className="px-6 py-3.5 text-left font-semibold">Symbol</th>
                  <th className="px-6 py-3.5 text-right font-semibold">LTP (₹)</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Change (₹)</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Timestamp</th>
                  <th className="px-6 py-3.5 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {REQUIRED_SYMBOLS.map((sym) => {
                  const item = ticks[sym] || { symbol: sym, ltp: 0, change: 0, timestamp: '—' };
                  const isUp = item.change >= 0;

                  return (
                    <tr
                      key={sym}
                      className={`border-b border-[#232936]/50 transition-all duration-300 ${
                        item.flash === 'up'
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : item.flash === 'down'
                          ? 'bg-rose-500/20 text-rose-200'
                          : 'hover:bg-[#1E2433]/50'
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-200 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0B0E14] border border-[#232936] flex items-center justify-center font-bold text-xs text-emerald-400">
                          {sym.split(':')[1]?.substring(0, 3) || 'NSE'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{sym}</p>
                          <p className="text-xs text-slate-400 font-sans">{item.name || 'NSE Equity'}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className={`text-base font-bold transition-all ${
                          item.flash === 'up'
                            ? 'text-emerald-400 scale-105 inline-block'
                            : item.flash === 'down'
                            ? 'text-rose-400 scale-105 inline-block'
                            : isUp
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}>
                          ₹{formatPrice(item.ltp)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isUp
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isUp ? '+' : ''}{formatPrice(item.change)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-slate-400 text-xs">
                        {item.timestamp}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          <Zap className="w-3 h-3 text-emerald-400" /> Live
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
