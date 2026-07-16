import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CREDITS } from '../../lib/legal';

export function Footer() {
  const { t } = useLanguage();
  const legalLinks = [
    { to: '/cgv', label: t('legal_cgv') },
    { to: '/cgu', label: t('legal_cgu') },
    { to: '/mentions-legales', label: t('legal_mentions') },
    { to: '/confidentialite', label: t('legal_privacy') },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 mt-auto" data-testid="site-footer">
      <div className="container grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <img src="/logo.png" alt="LOGILINK GLOBAL" className="h-9 w-auto" />
            <span className="text-xl font-heading font-bold text-white">LOGILINK GLOBAL</span>
          </div>
          <p className="text-sm max-w-xs">{t('footer_tagline')}</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_nav')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-orange-400 transition-colors">{t('nav_home')}</Link></li>
            <li><Link to="/track" className="hover:text-orange-400 transition-colors">{t('nav_track')}</Link></li>
            <li><Link to="/send?dir=EU_TO_CM" className="hover:text-orange-400 transition-colors">{t('nav_send')}</Link></li>
            <li><Link to="/backoffice" className="hover:text-orange-400 transition-colors">{t('nav_admin')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_legal')}</h4>
          <ul className="space-y-2 text-sm">
            {legalLinks.map((l) => (
              <li key={l.to}><Link to={l.to} data-testid={`footer-${l.to.slice(1)}`} className="hover:text-orange-400 transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_contact')}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500 shrink-0" /> {CREDITS.address}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-orange-500 shrink-0" /> {CREDITS.phone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-orange-500 shrink-0" /> {CREDITS.email}</li>
          </ul>
        </div>
      </div>

      <div className="container mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <span className="font-mono">{t('footer_text')}</span>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-5">
          <a href={CREDITS.dev_url} target="_blank" rel="noreferrer" data-testid="footer-dev-link" className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors">
            {t('footer_made_by')} <span className="text-slate-300 font-medium">{CREDITS.dev}</span> <ExternalLink className="h-3 w-3" />
          </a>
          <a href={CREDITS.comm_url} target="_blank" rel="noreferrer" data-testid="footer-comm-link" className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors">
            {t('footer_comm_by')} <span className="text-slate-300 font-medium">{CREDITS.comm}</span> <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
