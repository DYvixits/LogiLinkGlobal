import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/ui/Header';
import { Footer } from '../components/ui/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { LEGAL } from '../lib/legal';

export default function Legal({ doc }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const content = (LEGAL[doc] && LEGAL[doc][language]) || LEGAL[doc]?.fr;

  useEffect(() => { window.scrollTo(0, 0); }, [doc]);

  if (!content) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="container py-12 max-w-3xl flex-1">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium text-sm" data-testid="legal-back">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10" data-testid={`legal-${doc}`}>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">{content.title}</h1>
          <p className="text-xs font-mono text-slate-400 mt-2 mb-8">{content.updated}</p>

          <div className="space-y-7">
            {content.sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">{s.h}</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{s.p}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
