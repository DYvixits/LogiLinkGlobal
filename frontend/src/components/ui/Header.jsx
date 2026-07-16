import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Globe, Menu, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function Header() {
  const { t, language, toggleLanguage } = useLanguage();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: t('nav_home') },
    { to: '/track', label: t('nav_track') },
    { to: '/send?dir=EU_TO_CM', label: t('nav_send') },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="logo-link">
          <div className="bg-slate-900 text-white p-2 rounded-lg group-hover:bg-orange-600 transition-colors">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-xl font-heading font-bold tracking-tight text-slate-900">
            LOGILINK <span className="text-orange-600">GLOBAL</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.to === '/' ? 'home' : l.to.split('?')[0].slice(1)}`}
              className={`text-sm font-medium transition-colors hover:text-orange-600 ${pathname === l.to.split('?')[0] ? 'text-slate-900' : 'text-slate-500'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            data-testid="language-toggle-button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" /> {language}
          </button>
          <Link
            to="/backoffice"
            data-testid="nav-backoffice"
            className="hidden sm:inline-flex items-center bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-all hover:-translate-y-[1px] shadow-sm"
          >
            {t('nav_admin')}
          </Link>
          <button className="md:hidden p-2 text-slate-700" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block text-sm font-medium text-slate-700">
              {l.label}
            </Link>
          ))}
          <Link to="/backoffice" onClick={() => setOpen(false)} className="block text-sm font-semibold text-orange-600">
            {t('nav_admin')}
          </Link>
        </div>
      )}
    </header>
  );
}
