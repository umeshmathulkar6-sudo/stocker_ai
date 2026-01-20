
import React, { memo } from 'react';
import { ViewState } from '../types';
import { Button } from './ui/Button';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

const ICONS = {
  Trend: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Create: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Gallery: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Tag: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  Upscale: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  ),
  Link: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.336 9.53 19.886 7.558 17.52 3.974 19.78 3.513 15.657l1.376-2.126A6 6 0 0115 7z" />
    </svg>
  )
};

const NavItem = memo(({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-gradient-to-r from-indigo-600/10 to-purple-600/10 text-indigo-400 border border-indigo-500/20' 
        : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className="font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
  </button>
));

NavItem.displayName = 'NavItem';

const Layout = memo<LayoutProps>(({ currentView, onNavigate, children }) => {
  
  const handleConnectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
    } else {
      alert("API Key selection is managed by the hosting environment.");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Background Ambience - Static, non-reactive */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 border-r border-slate-800/50 bg-[#0f172a]/80 backdrop-blur-xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-xl">S</div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Stocker AI
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Contributor Pro</p>
            </div>
          </div>

          <div className="space-y-2">
            <NavItem 
              icon={<ICONS.Trend />} 
              label="Market Trends" 
              active={currentView === 'trends'} 
              onClick={() => onNavigate('trends')} 
            />
            <NavItem 
              icon={<ICONS.Create />} 
              label="Create Assets" 
              active={currentView === 'create'} 
              onClick={() => onNavigate('create')} 
            />
            <NavItem 
              icon={<ICONS.Gallery />} 
              label="Asset Gallery" 
              active={currentView === 'gallery'} 
              onClick={() => onNavigate('gallery')} 
            />
            <NavItem 
              icon={<ICONS.Upscale />} 
              label="Pro Upscaler" 
              active={currentView === 'upscale'} 
              onClick={() => onNavigate('upscale')} 
            />
            <NavItem 
              icon={<ICONS.Tag />} 
              label="Metadata Optimizer" 
              active={currentView === 'metadata'} 
              onClick={() => onNavigate('metadata')} 
            />
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800/50">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
             <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-400 font-medium">System Online</span>
             </div>
             <Button 
                onClick={handleConnectKey}
                variant="primary"
                fullWidth
                size="sm"
                leftIcon={<ICONS.Link />}
                className="!text-xs"
              >
                Connect API Key
              </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 p-4 z-50 flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
           <span className="font-bold text-lg">Stocker AI</span>
        </div>
        <Button 
          onClick={handleConnectKey}
          variant="primary"
          size="sm"
          className="!text-xs !py-1.5"
        >
          Connect Key
        </Button>
      </div>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0f172a]/90 backdrop-blur-md border-t border-slate-800 p-2 z-50 flex justify-around safe-area-pb">
          <button onClick={() => onNavigate('trends')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${currentView === 'trends' ? 'text-indigo-400 bg-white/5' : 'text-slate-500'}`}>
            <ICONS.Trend />
            <span className="text-[10px] font-medium">Trends</span>
          </button>
          <button onClick={() => onNavigate('create')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${currentView === 'create' ? 'text-indigo-400 bg-white/5' : 'text-slate-500'}`}>
            <ICONS.Create />
            <span className="text-[10px] font-medium">Create</span>
          </button>
          <button onClick={() => onNavigate('upscale')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${currentView === 'upscale' ? 'text-indigo-400 bg-white/5' : 'text-slate-500'}`}>
            <ICONS.Upscale />
            <span className="text-[10px] font-medium">Upscale</span>
          </button>
          <button onClick={() => onNavigate('gallery')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${currentView === 'gallery' ? 'text-indigo-400 bg-white/5' : 'text-slate-500'}`}>
            <ICONS.Gallery />
            <span className="text-[10px] font-medium">Gallery</span>
          </button>
          <button onClick={() => onNavigate('metadata')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${currentView === 'metadata' ? 'text-indigo-400 bg-white/5' : 'text-slate-500'}`}>
            <ICONS.Tag />
            <span className="text-[10px] font-medium">Metadata</span>
          </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 px-4 py-6 md:p-10 max-w-7xl mx-auto mb-20 md:mb-0 relative z-10 w-full pt-20 md:pt-10">
        {children}
      </main>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
