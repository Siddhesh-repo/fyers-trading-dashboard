import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { HealthStatusCard } from './components/HealthStatusCard';
import { fetchHealthStatus } from './services/healthService';
import { getAuthStatus } from './services/authService';
import MarketPage from './pages/MarketPage';
import PortfolioPage from './pages/PortfolioPage';
import MarketWatchPage from './pages/MarketWatchPage';
import { Activity, BarChart2, Briefcase, Radio, ShieldCheck, ArrowRight, Zap, ListOrdered } from 'lucide-react';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [isFyersAuthenticated, setIsFyersAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHealthStatus();
      setHealthData(data);
      setLastChecked(new Date());

      if (data.status === 'healthy') {
        const authData = await getAuthStatus();
        setIsFyersAuthenticated(authData.authenticated);
      }
    } catch (err) {
      console.error('Failed to fetch backend health status:', err);
      setError(err.message || 'Could not connect to trading server.');
      setHealthData(null);
      setIsFyersAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      alert(`FYERS Authentication Message: ${errorParam}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <MainLayout
      isConnected={healthData?.status === 'healthy'}
      lastChecked={lastChecked}
      onRefresh={checkHealth}
      isLoading={isLoading}
      isFyersAuthenticated={isFyersAuthenticated}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'market' && <MarketPage isFyersAuthenticated={isFyersAuthenticated} />}
      {activeTab === 'marketwatch' && <MarketWatchPage isFyersAuthenticated={isFyersAuthenticated} />}
      {(activeTab === 'portfolio' || activeTab === 'orders') && (
        <PortfolioPage isFyersAuthenticated={isFyersAuthenticated} activeSection={activeTab} />
      )}
      {activeTab === 'dashboard' && (
        <DashboardContent
          healthData={healthData}
          error={error}
          isLoading={isLoading}
          onRefresh={checkHealth}
          lastChecked={lastChecked}
          isFyersAuthenticated={isFyersAuthenticated}
          onNavigate={setActiveTab}
        />
      )}
    </MainLayout>
  );
}

const DashboardContent = ({ healthData, error, isLoading, onRefresh, lastChecked, isFyersAuthenticated, onNavigate }) => (
  <div className="space-y-6">
    {/* Executive Overview Header */}
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Trading Terminal Overview</h1>
        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          System Operational
        </span>
      </div>
      <p className="text-sm text-slate-400">
        Professional multi-asset trading dashboard integrated with FYERS API v3.
      </p>
    </div>

    {/* Health Status Monitor */}
    <HealthStatusCard
      healthData={healthData}
      error={error}
      isLoading={isLoading}
      onRefresh={onRefresh}
      lastChecked={lastChecked}
    />

    {/* Core Modules Quick Access Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Live Market Ticker Module */}
      <div className="p-5 rounded-2xl bg-[#151923] border border-[#232936] space-y-4 flex flex-col justify-between shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              WebSocket Live
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Live Market Watch</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Real-time tick streaming for benchmark symbols including SBIN, RELIANCE, TCS, INFY, and HDFCBANK.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('marketwatch')}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0B0E14] hover:bg-emerald-600 hover:text-white text-slate-200 border border-[#232936] text-xs font-semibold transition-all group"
        >
          <span>Open Live Stream</span>
          <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-white transition-all" />
        </button>
      </div>

      {/* Market Data & Analytics Module */}
      <div className="p-5 rounded-2xl bg-[#151923] border border-[#232936] space-y-4 flex flex-col justify-between shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              OHLC &amp; Depth
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Market Analytics</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Single &amp; multi-symbol quotes, Level 2 order book depth, and TradingView interactive candlestick charts.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('market')}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0B0E14] hover:bg-blue-600 hover:text-white text-slate-200 border border-[#232936] text-xs font-semibold transition-all group"
        >
          <span>Explore Market Data</span>
          <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-white transition-all" />
        </button>
      </div>

      {/* Portfolio & Account Module */}
      <div className="p-5 rounded-2xl bg-[#151923] border border-[#232936] space-y-4 flex flex-col justify-between shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border font-mono ${
              isFyersAuthenticated
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {isFyersAuthenticated ? 'FYERS Auth Active' : 'Auth Required'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Portfolio &amp; Orders</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Track available trading margins, active equity holdings, net derivative positions, and order history.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate('portfolio')}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0B0E14] hover:bg-amber-600 hover:text-white text-slate-200 border border-[#232936] text-xs font-semibold transition-all"
          >
            <span>Portfolio</span>
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0B0E14] hover:bg-violet-600 hover:text-white text-slate-200 border border-[#232936] text-xs font-semibold transition-all"
          >
            <span>Order Book</span>
            <ListOrdered className="w-3.5 h-3.5 text-violet-400" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
