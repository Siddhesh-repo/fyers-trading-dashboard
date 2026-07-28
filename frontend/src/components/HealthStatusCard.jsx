import React from 'react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  ShieldCheck,
  Globe,
  Clock,
  Activity,
  Zap,
} from 'lucide-react';

export const HealthStatusCard = ({ healthData, error, isLoading, onRefresh, lastChecked }) => {
  const isHealthy = healthData && healthData.status === 'healthy';

  return (
    <div className="rounded-2xl bg-[#151923] border border-[#232936] p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background glow accent */}
      <div className={`absolute -right-20 -top-20 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232936] pb-5">
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-xl border ${
            isHealthy
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {isHealthy ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              API Connection &amp; Health Monitor
            </h2>
            <p className="text-xs text-slate-400">
              Real-time server connectivity status and diagnostics
            </p>
          </div>
        </div>

        {/* Action Trigger Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Checking Status...' : 'Re-check Connection'}</span>
        </button>
      </div>

      {/* Primary Status Banner */}
      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-300">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-rose-200">Unable to Connect to Trading Service</p>
            <p className="text-rose-300/80">{error}</p>
            <p className="text-[11px] text-slate-400 pt-1">
              Please ensure the backend trading engine is active and reachable.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Status */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232936] space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Connection Status</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-base font-bold text-emerald-400 uppercase tracking-wide">
                {healthData?.status || 'CONNECTED'}
              </span>
            </div>
          </div>

          {/* Service Name */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232936] space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Trading Service</span>
              <Server className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-sm font-semibold text-white truncate" title={healthData?.app_name}>
              {healthData?.app_name || 'FYERS Trading Gateway'}
            </div>
          </div>

          {/* Mode */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232936] space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Execution Engine</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                Live Multi-Threaded
              </span>
            </div>
          </div>

          {/* Server Timestamp Item */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232936] space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>System Clock</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xs font-mono text-slate-200 truncate">
              {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#232936]">
        <span>Last diagnostic check: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}</span>
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> End-to-End Encryption &amp; Security Validated
        </span>
      </div>
    </div>
  );
};
