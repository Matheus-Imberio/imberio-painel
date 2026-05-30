import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  LogOut,
  Cog,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  const navItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Clientes', path: '/admin/clientes' },
    { icon: FileText, label: 'Orçamentos', path: '/admin/orcamentos' },
    { icon: Package, label: 'Peças', path: '/admin/pecas' },
  ] : [
    { icon: LayoutDashboard, label: 'Início', path: '/operador' },
    { icon: Users, label: 'Clientes', path: '/operador/clientes' },
    { icon: FileText, label: 'Orçamentos', path: '/operador/orcamentos' },
  ];

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className={cn(
      "flex flex-col h-full bg-sidebar text-sidebar-foreground",
      className
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Cog className="w-6 h-6 text-sidebar-primary-foreground motor-spin" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">DYQUE & DAYA</h1>
            <p className="text-xs text-sidebar-foreground/60">Registros</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavigation}
              className={cn(
                "nav-item",
                isActive && "active"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>
      
      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-accent-foreground">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
