import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Zap,
  FileText,
  Users,
  Layers,
  Compass,
  Milestone,
  LayoutDashboard,
  Lock,
  Menu,
  X,
  LogOut,
  UserCheck,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/', icon: Zap },
    { name: 'Project', path: '/project', icon: Compass },
    { name: 'Architecture', path: '/architecture', icon: Layers },
    { name: 'Roadmap', path: '/roadmap', icon: Milestone },
    { name: 'Presentations', path: '/presentations', icon: FileText },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Team', path: '/team', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:border-emerald-500/60 group-hover:bg-emerald-500/20 transition-all shadow-sm">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">CARBONROUTE</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                  Planning Phase
                </span>
              </div>
              <span className="text-[11px] text-emerald-400/90 font-mono tracking-wide font-medium">
                Team TriFlux &bull; UCS503
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 font-mono ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions: CTA Button + Admin/Login */}
          <div className="hidden sm:flex items-center space-x-2.5">
            <Link
              to="/presentations/planning/v1"
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all font-mono shadow-sm group"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              <span>View Planning Presentation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800 text-xs">
                <Link
                  to="/admin"
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono"
                  title="Admin Dashboard"
                >
                  <Shield className="w-3.5 h-3.5 mr-1" />
                  <span>Admin</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/admin"
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-mono transition-colors"
              >
                <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>Admin / Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden space-x-2">
            <Link
              to="/presentations/planning/v1"
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs font-mono"
            >
              <span>Planning V1</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-mono ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 text-emerald-400" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-800 space-y-1">
            <Link
              to="/presentations/planning/v1"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs font-mono"
            >
              <FileText className="w-4 h-4" />
              <span>View Planning Presentation V1</span>
            </Link>

            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-900"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Admin / Login</span>
            </Link>

            {isAuthenticated && (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-mono text-rose-300 bg-rose-950/30 border border-rose-900/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user?.username})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
