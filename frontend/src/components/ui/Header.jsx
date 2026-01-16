import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, User } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-2">
           <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-2">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-2xl font-heading font-bold tracking-tighter hidden md:block">
                LOGILINK <span className="text-accent">GLOBAL</span>
              </span>
           </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-accent transition-colors uppercase tracking-widest">
            Accueil
          </Link>
          <Link to="/track" className="text-sm font-medium hover:text-accent transition-colors uppercase tracking-widest flex items-center gap-2">
            <Truck className="h-4 w-4" /> Suivi
          </Link>
          <Link to="/backoffice" className="text-sm font-medium hover:text-accent transition-colors uppercase tracking-widest flex items-center gap-2">
            <User className="h-4 w-4" /> Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
