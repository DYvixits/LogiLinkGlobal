import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Settings2, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SettingsView() {
  const { t } = useLanguage();
  const [pricing, setPricing] = useState(null);

  useEffect(() => { axios.get(`${BACKEND_URL}/api/settings`).then(r => setPricing(r.data)).catch(() => {}); }, []);

  const save = async () => {
    try { await axios.put(`${BACKEND_URL}/api/settings`, pricing); toast.success('Paramètres enregistrés'); }
    catch { toast.error('Erreur'); }
  };

  if (!pricing) return null;

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h2 className="text-2xl font-heading font-bold text-slate-900">{t('settings_title')}</h2>
        <p className="text-slate-500 text-sm">{t('settings_subtitle')}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-900 font-semibold"><Settings2 className="h-4 w-4 text-orange-600" /> {t('settings_title')}</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={`${t('price_eu_cm')} (€/kg)`} type="number" value={pricing.price_per_kg.EU_TO_CM}
            onChange={v => setPricing({ ...pricing, price_per_kg: { ...pricing.price_per_kg, EU_TO_CM: parseFloat(v) || 0 } })} testid="set-price-eucm" />
          <Field label={`${t('price_cm_eu')} (€/kg)`} type="number" value={pricing.price_per_kg.CM_TO_EU}
            onChange={v => setPricing({ ...pricing, price_per_kg: { ...pricing.price_per_kg, CM_TO_EU: parseFloat(v) || 0 } })} testid="set-price-cmeu" />
          <Field label={`${t('vat')} (%)`} type="number" value={pricing.vat_percent}
            onChange={v => setPricing({ ...pricing, vat_percent: parseFloat(v) || 0 })} testid="set-vat" />
          <Field label={t('currency')} value={pricing.currency}
            onChange={v => setPricing({ ...pricing, currency: v })} testid="set-currency" />
        </div>
        <button onClick={save} data-testid="settings-save" className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-800"><Save className="h-4 w-4" /> {t('save_settings')}</button>
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, type = 'text', testid }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold uppercase text-slate-500">{label}</label>
    <input type={type} value={value} data-testid={testid} onChange={e => onChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-600" />
  </div>
);
