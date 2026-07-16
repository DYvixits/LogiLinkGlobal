import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Search, ShieldCheck, Route, UserX, Wallet,
  FileText, PackageCheck, CalendarClock, Truck, Star, Plus, Minus,
  MapPin, Package, Mail, Phone
} from 'lucide-react';
import { Header } from '../components/ui/Header';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const HERO_IMG = "https://images.pexels.com/photos/26585021/pexels-photo-26585021.jpeg";

export default function Home() {
  const { t } = useLanguage();
  const [schedule, setSchedule] = useState({ eu_to_cm: [], cm_to_eu: [] });
  const [trackId, setTrackId] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/schedule`).then(res => setSchedule(res.data)).catch(() => {});
  }, []);

  const handleTrack = (e) => { e.preventDefault(); if (trackId) navigate(`/track?id=${trackId}`); };

  const steps = [
    { icon: FileText, ...pick(t, 'how_1') },
    { icon: PackageCheck, ...pick(t, 'how_2') },
    { icon: CalendarClock, ...pick(t, 'how_3') },
    { icon: Truck, ...pick(t, 'how_4') },
  ];
  const reasons = [
    { icon: ShieldCheck, ...pick(t, 'why_1') },
    { icon: Route, ...pick(t, 'why_2') },
    { icon: UserX, ...pick(t, 'why_3') },
    { icon: Wallet, ...pick(t, 'why_4') },
  ];
  const testimonials = [1, 2, 3].map(i => ({ text: t(`testi_${i}_text`), name: t(`testi_${i}_name`), role: t(`testi_${i}_role`) }));
  const faqs = [1, 2, 3, 4, 5].map(i => ({ q: t(`faq_q${i}`), a: t(`faq_a${i}`) }));
  const agencies = ['Paris', 'Lodi (Italie)', 'Bruxelles', 'Douala', 'Yaoundé', 'Bafoussam'];
  const stats = [
    { value: '15K+', label: t('stat_parcels') },
    { value: '4 800+', label: t('stat_clients') },
    { value: '98%', label: t('stat_ontime') },
    { value: '2', label: t('stat_weekly') },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* HERO */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMG} alt="Cargo ship" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40" />
        </div>
        <div className="container relative z-10 py-24 md:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-orange-300">
              <MapPin className="h-3.5 w-3.5" /> {t('hero_badge')}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-[1.05]">
              {t('hero_title_1')} <span className="text-orange-500">{t('hero_title_2')}</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-lg">{t('hero_subtitle')}</p>

            <form onSubmit={handleTrack} className="flex max-w-md bg-white rounded-xl p-1.5 shadow-xl" data-testid="hero-track-form">
              <input
                type="text"
                data-testid="hero-track-input"
                placeholder={t('track_placeholder')}
                className="flex-1 bg-transparent border-none px-4 py-2.5 focus:ring-0 focus:outline-none text-slate-900 placeholder:text-slate-400 font-mono text-sm"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <button type="submit" data-testid="hero-track-submit" className="bg-orange-600 text-white px-5 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2">
                <Search className="h-4 w-4" /> <span className="hidden sm:inline">{t('track_cta')}</span>
              </button>
            </form>
          </div>

          {/* Departures board */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 animate-fade-in" style={{ animationDelay: '120ms' }}>
            <h3 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
              <CalendarClock className="text-orange-500 h-5 w-5" /> {t('next_departures')}
            </h3>
            <DepartureRow label={t('direction_eu_cm')} tag="VEN" dates={schedule.eu_to_cm} />
            <div className="h-px bg-white/10 my-5" />
            <DepartureRow label={t('direction_cm_eu')} tag="SAM" dates={schedule.cm_to_eu} />
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="container py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center" data-testid={`stat-${i}`}>
              <div className="text-3xl md:text-4xl font-heading font-bold text-slate-900">{s.value}</div>
              <div className="text-xs md:text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEND CTA CARDS */}
      <section className="py-20 container">
        <div className="grid md:grid-cols-2 gap-6">
          {[['EU_TO_CM', 'eu_to_cm'], ['CM_TO_EU', 'cm_to_eu']].map(([dir, key]) => (
            <Link
              key={dir}
              to={`/send?dir=${dir}`}
              data-testid={`send-card-${dir}`}
              className="group relative rounded-2xl bg-slate-900 text-white p-8 overflow-hidden card-hover"
            >
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-orange-600/20 rounded-full blur-2xl group-hover:bg-orange-600/40 transition-all" />
              <div className="relative z-10">
                <span className="text-xs uppercase tracking-widest text-orange-400 font-semibold">{t('want_to_send')}</span>
                <h2 className="text-3xl font-heading font-bold mt-2 mb-4">{t(key)}</h2>
                <span className="inline-flex items-center gap-2 text-sm font-semibold border-b-2 border-orange-500 pb-1 group-hover:gap-3 transition-all">
                  {t('start_button')} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <SectionTitle title={t('how_title')} subtitle={t('how_subtitle')} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {steps.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm card-hover" data-testid={`how-step-${i}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-50 text-orange-600 p-2.5 rounded-lg"><s.icon className="h-5 w-5" /></div>
                  <span className="text-4xl font-heading font-bold text-slate-100">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20 container">
        <SectionTitle title={t('why_title')} subtitle={t('why_subtitle')} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {reasons.map((r, i) => (
            <div key={i} className="p-6 rounded-xl border border-slate-100 hover:border-orange-200 transition-colors" data-testid={`why-${i}`}>
              <div className="bg-slate-900 text-white p-2.5 rounded-lg w-fit mb-4"><r.icon className="h-5 w-5" /></div>
              <h3 className="font-semibold text-slate-900 mb-1">{r.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container">
          <SectionTitle title={t('testi_title')} light />
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {testimonials.map((tt, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6" data-testid={`testi-${i}`}>
                <div className="flex gap-1 mb-4 text-orange-400">
                  {[...Array(5)].map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-slate-200 mb-6 leading-relaxed">"{tt.text}"</p>
                <div className="font-semibold">{tt.name}</div>
                <div className="text-sm text-slate-400">{tt.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENCIES */}
      <section className="py-20 container">
        <SectionTitle title={t('agencies_title')} subtitle={t('agencies_subtitle')} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12">
          {agencies.map((a, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-4" data-testid={`agency-${i}`}>
              <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
              <span className="text-sm font-medium text-slate-700">{a}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="container max-w-3xl">
          <SectionTitle title={t('faq_title')} />
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid={`faq-${i}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-medium text-slate-900">{f.q}</span>
                  {openFaq === i ? <Minus className="h-4 w-4 text-orange-600 shrink-0" /> : <Plus className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container">
        <div className="rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 text-white p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 relative z-10">{t('cta_title')}</h2>
          <p className="text-orange-100 mb-8 relative z-10">{t('cta_subtitle')}</p>
          <Link to="/send?dir=EU_TO_CM" data-testid="cta-send-btn" className="relative z-10 inline-flex items-center gap-2 bg-white text-orange-700 font-semibold px-6 py-3 rounded-lg hover:-translate-y-[2px] transition-transform shadow-lg">
            {t('cta_button')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 mt-auto">
        <div className="container grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-orange-600 text-white p-2 rounded-lg"><Package className="h-5 w-5" /></div>
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
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer_contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500" /> Via Roma 35, 26866 Lodi, Italie</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-orange-500" /> +39 3287091255</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-orange-500" /> support@logilink.com</li>
            </ul>
          </div>
        </div>
        <div className="container mt-12 pt-6 border-t border-white/10 text-center text-xs text-slate-500 font-mono">
          {t('footer_text')}
        </div>
      </footer>
    </div>
  );
}

const pick = (t, prefix) => ({ title: t(`${prefix}_title`), desc: t(`${prefix}_desc`) });

const SectionTitle = ({ title, subtitle, light }) => (
  <div className="text-center max-w-2xl mx-auto">
    <h2 className={`text-3xl md:text-4xl font-heading font-bold ${light ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
    {subtitle && <p className={`mt-3 ${light ? 'text-slate-300' : 'text-slate-500'}`}>{subtitle}</p>}
  </div>
);

const DepartureRow = ({ label, tag, dates }) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <span className="font-medium text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-400" /> {label}</span>
      <span className="text-[10px] bg-orange-600 px-2 py-0.5 rounded uppercase font-bold">{tag}</span>
    </div>
    <div className="grid grid-cols-4 gap-2">
      {(dates || []).slice(0, 4).map((date, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center text-xs font-mono">
          {new Date(date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
        </div>
      ))}
    </div>
  </div>
);
