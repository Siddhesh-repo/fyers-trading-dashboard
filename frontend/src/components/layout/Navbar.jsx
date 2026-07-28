import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Clock, RefreshCw, Cpu, LogIn } from 'lucide-react';
import { getLoginUrl } from '../../services/authService';

export const Navbar = ({ isConnected, lastChecked, onRefresh, isLoading, isFyersAuthenticated }) => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleConnectFyers = async () => {
    try {
      setIsLoggingIn(true);
      const { login_url } = await getLoginUrl();
      if (login_url) {
        window.location.href = login_url;
      }
    } catch (error) {
      console.error("Failed to fetch login URL", error);
      alert("Failed to connect to FYERS. Check credentials.");
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="h-16 bg-[#151923] border-b border-[#232936] px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Left section: Logo & App Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg tracking-tight text-white">FYERS</h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
              Terminal v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">Production Trading Architecture</p>
        </div>
      </div>

      {/* Right section: System Status & Time */}
      <div className="flex items-center space-x-4">
        {/* Backend Status Indicator Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0B0E14] border border-[#232936] text-xs font-medium">
          <div className="flex items-center space-x-2">
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {isConnected ? 'API Connected' : 'API Disconnected'}
            </span>
          </div>
        </div>

        {/* FYERS Connect Button */}
        {!isFyersAuthenticated ? (
          <button
            onClick={handleConnectFyers}
            disabled={isLoggingIn}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isLoggingIn ? "Connecting..." : "Connect FYERS"}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>FYERS Connected</span>
          </div>
        )}

        {/* Live Clock Widget */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0B0E14] border border-[#232936] text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime}</span>
        </div>

        {/* Manual Sync/Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-[#0B0E14] hover:bg-[#1E2433] border border-[#232936] text-slate-300 hover:text-white transition-all disabled:opacity-50"
          title="Refresh Backend Status"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
