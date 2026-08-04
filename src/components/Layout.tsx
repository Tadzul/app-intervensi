import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileEdit, BarChart2, AlertCircle, FileText, Printer, Menu, LogIn, LogOut, X, Loader2, Settings, Award, RefreshCw, CheckCircle2, Cloud, FolderKanban } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDataStore } from '../store/useDataStore';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const { isAdmin, isLoadingData, isSyncing, lastSyncTime, loadingProgress, loadingMessage, refreshData, loginAdmin, logoutAdmin } = useDataStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(loginUsername, loginPassword);
    if (success) {
      setShowLoginPrompt(false);
      setLoginUsername('');
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError('Log masuk gagal: Nama pengguna atau kata laluan tidak sah.');
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher-registration', label: 'Pendaftaran Guru', icon: Users },
    { to: '/intervention-form', label: 'Borang Intervensi', icon: FileEdit },
    { to: '/root-cause-analysis', label: 'Analisis Punca & Isu', icon: AlertCircle },
    { to: '/reports', label: 'Laporan', icon: FileText },
    { to: '/print-analysis', label: 'Intervensi Versi Cetak', icon: Printer },
    { to: '/panitia-intervention', label: 'Intervensi Panitia', icon: FolderKanban },
    { to: '/subject-analysis', label: 'Analisis Mata Pelajaran', icon: BarChart2 },
    { to: '/student-analysis', label: 'Analisis Murid', icon: Users },
    { to: '/top-students', label: 'Murid Pilihan', icon: Award },
    { to: '/system-settings', label: 'Tetapan Sistem', icon: Settings },
  ];

  const currentDate = new Intl.DateTimeFormat('ms-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-blue-950 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 no-print shadow-xl flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex items-center px-6 bg-blue-950/50 border-b border-blue-900/50 font-bold text-2xl text-gold-400 tracking-wider shadow-sm shrink-0">
          SAIAS
        </div>
        <div className="p-4 pb-20 flex-1 overflow-y-auto">
          <p className="text-xs text-blue-300/70 uppercase font-bold tracking-wider mb-4 px-2">Menu Utama</p>
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                  isActive 
                    ? "bg-gradient-to-r from-gold-400 to-amber-500 text-blue-950 shadow-md transform scale-[1.02]" 
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 border-b-2 border-gold-500 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 no-print shadow-lg">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-300 hover:text-white focus:outline-none transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-white hidden sm:block tracking-wide">
              SISTEM ANALISIS INTERVENSI AKADEMIK SEKOLAH
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Sync status indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/40 border border-blue-800/60 text-xs font-semibold">
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-300">Menyimpan ke database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">
                    Disimpan dalam Cache {lastSyncTime ? `(${lastSyncTime})` : ''}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => refreshData(true)}
              disabled={isSyncing || isLoadingData}
              title="Segarkan data dari database Google Sheet"
              className="p-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 hover:text-white rounded-lg border border-blue-700/50 transition-all flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing || isLoadingData ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Segarkan Sheet</span>
            </button>
            <div className="text-sm font-bold text-blue-200 hidden md:block tracking-wide">{currentDate}</div>
            <div className="flex items-center gap-4 pl-6 border-l border-blue-800/50">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-400 via-amber-400 to-yellow-500 shadow-lg flex items-center justify-center text-blue-950 font-black text-xl hover:scale-110 transition-transform duration-300 ring-2 ring-gold-400 ring-offset-2 ring-offset-blue-900 cursor-pointer" onClick={() => isAdmin ? logoutAdmin() : setShowLoginPrompt(true)}>
                {isAdmin ? 'A' : 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-extrabold text-white leading-none mb-1">{isAdmin ? 'Admin' : 'Pengguna Biasa'}</p>
                {isAdmin ? (
                  <button onClick={logoutAdmin} className="text-xs text-red-400 hover:text-red-300 font-bold tracking-wider flex items-center gap-1 transition-colors">
                    <LogOut className="w-3 h-3" /> Log Keluar
                  </button>
                ) : (
                  <button onClick={() => setShowLoginPrompt(true)} className="text-xs text-gold-400 hover:text-gold-300 font-bold tracking-wider flex items-center gap-1 transition-colors">
                    <LogIn className="w-3 h-3" /> Log Masuk Admin
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-4 border-b border-blue-800 flex justify-between items-center">
                <h3 className="font-bold text-white text-lg">Log Masuk Admin</h3>
                <button onClick={() => setShowLoginPrompt(false)} className="text-blue-300 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleLogin} className="p-6 space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
                    {loginError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Nama Pengguna</label>
                  <input 
                    type="text" 
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all outline-none"
                    placeholder="admin"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Kata Laluan</label>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all outline-none"
                    placeholder="••••"
                  />
                </div>
                <button type="submit" className="w-full pt-2">
                  <div className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-center">
                    Log Masuk
                  </div>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 flex flex-col relative">
          {isLoadingData && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/90 backdrop-blur-md">
              <div className="flex flex-col items-center gap-6 max-w-sm w-full px-6">
                <div className="w-16 h-16 relative flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="absolute inset-0 rounded-2xl border-[3px] border-slate-100"></div>
                  <div className="absolute inset-0 rounded-2xl border-[3px] border-blue-600 border-t-transparent animate-spin"></div>
                  <span className="text-blue-600 font-black text-sm absolute">{loadingProgress}%</span>
                </div>
                
                <div className="w-full space-y-3">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${loadingProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <p className="text-sm font-bold text-blue-950 tracking-wide">Sistem memproses data</p>
                    <p className="text-xs font-bold text-blue-600">Sila tunggu sebentar..</p>
                    <p className="text-xs font-medium text-slate-500 animate-pulse pt-1">{loadingMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="max-w-7xl mx-auto w-full flex-1">
            <Outlet />
          </div>
          <footer className="mt-8 text-center text-sm font-medium text-slate-400 no-print">
            Sistem Intervensi by Tadzul Apps @ 2026
          </footer>
        </div>
      </main>
    </div>
  );
}
