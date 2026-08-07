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
  { 
    id: 'redeem_monitor', 
    label: 'Redeem & LLM Monitor', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
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
    <div className="bg-sandalwood-bg min-h-screen flex w-screen text-charcoal-text font-sans">
      {/* Sidebar */}
      <aside 
        className="w-64 bg-sandalwood-bg h-screen fixed left-0 top-0 hidden lg:flex flex-col border-r border-parchment-border z-40 p-4" 
        data-purpose="sidebar"
      >
        {/* Header Brand */}
        <div className="flex items-center space-x-3 px-2 py-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kesari-primary to-celestial-gold flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h1 className="font-display font-semibold text-xl text-charcoal-text leading-tight">AstroSutra</h1>
            <p className="text-xs text-on-surface-variant">AI Analytics</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            
            let colorClasses = 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 duration-200';
            if (isActive) {
              colorClasses = 'bg-primary-container text-white font-semibold';
            }

            return (
              <a
                key={item.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection(item.id);
                }}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-all ${colorClasses}`}
              >
                <span className="mr-3">
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="mt-auto pt-4 border-t border-parchment-border space-y-1">
          <div 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 glass-card rounded-2xl cursor-pointer hover:bg-surface-container-high transition-colors"
            title="Click to sign out"
          >
            <img 
              alt="User Profile" 
              className="w-10 h-10 rounded-full object-cover border border-parchment-border" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLsmjYNr41pajetbRgGVqALvdDWmKBzRO-5zu1gjGvWNrxo_K4YPLdfUyL6Jgjhn77CedlQJsjTDkiayW4TGOkiGH8RskUkxSKdfGKU0UMMyCv-9G3Hn326XztjJTuWffXAH7tyjdOZQYaCXGkrJPCHk6z9ol8UGKO645Jt36v0kOzCTPxU0-dtvSUYdac_Q8pbsSC7IOocs3RsHEtEw0qrzkeBWa_j0_3hmSPzMeXGaZpt1agzIRW2yBiq9" 
              style={{ objectPosition: 'center', width: '40px', height: '40px' }}
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-charcoal-text truncate">Anmol Dixit</p>
              <p className="text-xs text-on-surface-variant truncate">anmoldixit091@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header (Only visible on small screens) */}
        <header className="lg:hidden bg-glass-overlay backdrop-blur-md border-b border-parchment-border sticky top-0 z-30 px-6 py-3 flex justify-between items-center shadow-sm">
          <h1 className="font-display font-bold text-lg text-kesari-primary">AstroSutra AI</h1>
          <button className="text-charcoal-text">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Dashboard Content Container */}
        <div className="flex-1 p-6 md:p-10 max-w-[1440px] mx-auto w-full space-y-8 overflow-y-auto pb-24">
          {/* Main Top Header */}
          <header className="flex justify-between items-center mb-2" data-purpose="content-header">
            <div>
              <h2 className="font-display text-4xl font-semibold text-charcoal-text">{activeLabel}</h2>
              <p className="text-sm text-on-surface-variant mt-1">Platform Intelligence Dashboard</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">search</span>
                </span>
                <input 
                  type="text" 
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface border border-parchment-border text-charcoal-text rounded-xl pl-9 pr-4 py-2 w-64 focus:ring-2 focus:ring-kesari-primary focus:border-kesari-primary text-sm outline-none transition-all shadow-sm"
                />
              </div>

              {/* Notification Bell */}
              <button className="p-2 border border-parchment-border bg-surface hover:bg-surface-container rounded-xl text-on-surface-variant relative shadow-sm transition-colors">
                <span className="material-symbols-outlined text-lg">notifications</span>
                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-error rounded-full border border-surface"></span>
              </button>
            </div>
          </header>

          {/* Dynamic Content Panel */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
