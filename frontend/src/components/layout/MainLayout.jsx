import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const MainLayout = ({ children, isConnected, lastChecked, onRefresh, isLoading, isFyersAuthenticated, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col">
      {/* Top Fixed Header */}
      <Navbar 
        isConnected={isConnected} 
        lastChecked={lastChecked} 
        onRefresh={onRefresh} 
        isLoading={isLoading} 
        isFyersAuthenticated={isFyersAuthenticated}
      />


      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

        {/* Dynamic Content Region */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#0B0E14] space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
