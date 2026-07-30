import React, { useState } from 'react';
import { User, logoutAdmin } from '../auth';

interface AdminLayoutProps {
  user: User;
  activeSection: string;
  setActiveSection: (section: string) => void;
  children: React.ReactNode;
}

const MENU_ITEMS = [
  { 
    id: 'overview', 
    label: 'Platform Overview', 
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
      </svg>
    )
  },
  { 
    id: 'modules', 
    label: 'Module Usage', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'llm', 
    label: 'LLM Analytics', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'performance', 
    label: 'API Performance', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'features', 
    label: 'Feature Usage', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'questions', 
    label: 'Most Asked Questions', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'feedback', 
    label: 'Feedback Dashboard', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'subscriptions', 
    label: 'Subscription Metrics', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'geography', 
    label: 'Geographic Insights', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.065M15 20.288E2.5 2.5 0 0012.5 18H12a2 2 0 01-2-2v-1a2 2 0 00-2-2h-1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'errors', 
    label: 'Error Dashboard', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
  { 
    id: 'activity', 
    label: 'Activity Feed', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    )
  },
];

export default function AdminLayout({ user, activeSection, setActiveSection, children }: AdminLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Get current active title
  const activeLabel = MENU_ITEMS.find(m => m.id === activeSection)?.label || 'Dashboard';

  return (
    <div className="flex min-h-screen">
      {/* Background nebula */}
      <div className="nebula"></div>

      {/* Sidebar */}
      <aside className="w-64 flex flex-col glass-panel border-r-0 py-8 px-4" data-purpose="sidebar">
        {/* Sidebar Brand Logo */}
        <div className="flex items-center gap-2 mb-10 px-4">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-white">AstroSutra</span>
            <span className="text-indigo-400 ml-1">Admin</span>
          </h1>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const isErrorTab = item.id === 'errors';
            
            let colorClasses = 'text-slate-400 hover:text-white hover:bg-white/5';
            if (isActive) {
              colorClasses = 'sidebar-item-active text-white';
            } else if (isErrorTab) {
              colorClasses = 'text-red-400 hover:text-red-300 hover:bg-red-400/10';
            }

            return (
              <a
                key={item.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection(item.id);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${colorClasses}`}
              >
                <span className={isActive ? 'text-indigo-400' : ''}>
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Sidebar Footer User Profile */}
        <div className="mt-auto px-2">
          <div 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 glass-card rounded-2xl cursor-pointer"
            title="Click to sign out"
          >
            <img 
              alt="User Profile" 
              className="w-10 h-10 rounded-full object-cover border border-white/10" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLsmjYNr41pajetbRgGVqALvdDWmKBzRO-5zu1gjGvWNrxo_K4YPLdfUyL6Jgjhn77CedlQJsjTDkiayW4TGOkiGH8RskUkxSKdfGKU0UMMyCv-9G3Hn326XztjJTuWffXAH7tyjdOZQYaCXGkrJPCHk6z9ol8UGKO645Jt36v0kOzCTPxU0-dtvSUYdac_Q8pbsSC7IOocs3RsHEtEw0qrzkeBWa_j0_3hmSPzMeXGaZpt1agzIRW2yBiq9" 
              style={{ objectPosition: 'center', width: '40px', height: '40px' }}
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">Anmol Dixit</p>
              <p className="text-xs text-slate-400 truncate">anmoldixit091@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8" data-purpose="main-content">
        <div className="h-full glass-panel rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">
          {/* Main Header */}
          <header className="flex justify-between items-center" data-purpose="content-header">
            <h2 className="font-bold text-white tracking-tight text-5xl">{activeLabel}</h2>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800/40 border border-slate-700/50 text-white rounded-xl pl-10 pr-4 py-2 w-64 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
                />
              </div>

              {/* Notification Bell */}
              <button className="p-2 glass-card rounded-xl text-slate-400 hover:text-white relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
              </button>
            </div>
          </header>

          {/* Dynamic Content Panel */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
