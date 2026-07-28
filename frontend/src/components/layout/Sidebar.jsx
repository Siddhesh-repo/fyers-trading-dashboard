import React from 'react';
import {
  LayoutDashboard,
  ListOrdered,
  Briefcase,
  PieChart,
  Sliders,
  Server,
  BarChart2,
  Radio,
} from 'lucide-react';

export const Sidebar = ({ activeTab = 'dashboard', onTabChange = () => {} }) => {
  const navItems = [
    { id: 'dashboard', label: 'System Overview', icon: LayoutDashboard, badge: 'Stage 1' },
    { id: 'market', label: 'Market Data', icon: BarChart2, badge: 'Stage 3' },
    { id: 'marketwatch', label: 'Live Stream', icon: Radio, badge: 'Stage 5' },
    { id: 'portfolio', label: 'Portfolio & Funds', icon: Briefcase, badge: 'Stage 4' },
    { id: 'orders', label: 'Order Book', icon: ListOrdered, badge: 'Stage 4' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, disabled: true },
    { id: 'settings', label: 'Settings', icon: Sliders, disabled: true },
  ];

  return (
    <aside className="w-64 bg-[#151923] border-r border-[#232936] flex flex-col justify-between hidden md:flex shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Upper Navigation Links */}
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onTabChange(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30'
                  : item.disabled
                  ? 'text-slate-600 cursor-not-allowed opacity-60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E2433]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
              {item.disabled && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 m-4 rounded-xl bg-[#0B0E14] border border-[#232936] space-y-2">
        <div className="flex items-center space-x-2 text-xs text-slate-300 font-semibold">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>FastAPI Backend</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Modular clean architecture setup with Pydantic configuration & CORS.
        </p>
        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-[#232936]">
          <span>REST API: v1</span>
          <span className="text-emerald-400 font-mono">200 OK</span>
        </div>
      </div>
    </aside>
  );
};
