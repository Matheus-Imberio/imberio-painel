import React, { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r border-sidebar-border shadow-2xl z-50">
        <Sidebar className="h-full" />
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen transition-all duration-200 ease-in-out">
        {/* Page Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="px-4 py-4 md:px-8 md:py-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Trigger */}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
                  <Sidebar onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
                {subtitle && (
                  <p className="hidden md:block text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
