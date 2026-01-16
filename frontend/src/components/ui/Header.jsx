import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, User, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function Header() {
  const { t, language, toggleLanguage } = useLanguage();

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
          <Link to="/" className="text-sm font-medium hover:text-accent transition-colors uppercase tracking-widest hidden sm:block">
            {t('nav_home')}
          </Link>
          <Link to="/track" className="text-sm font-medium hover:text-accent transition-colors uppercase tracking-widest flex items-center gap-2">
            <Truck className="h-4 w-4" /> {t('nav_track')}
          </Link>
          <Link to="/backoffice" className="text-sm font-medium hover:text-accent transition-colors uppercase tracking-widest flex items-center gap-2">
            <User className="h-4 w-4" /> {t('nav_admin')}
          </Link>
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1 text-sm font-bold uppercase bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
          >
            <Globe className="h-4 w-4" /> {language}
          </button>
        </nav>
      </div>
    </header>
  );
}
