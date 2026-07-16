import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AgenciesView() {
  const { t } = useLanguage();
  const [agencies, setAgencies] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', country: '', city: '', address: '', phone: '' });

  const load = () => axios.get(`${BACKEND_URL}/api/agencies`).then(r => setAgencies(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    try { await axios.post(`${BACKEND_URL}/api/agencies`, form); toast.success('Agence créée'); setOpen(false); setForm({ code: '', name: '', country: '', city: '', address: '', phone: '' }); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Erreur'); }
  };
  const remove = async (code) => { if (!window.confirm(code + ' ?')) return; await axios.delete(`${BACKEND_URL}/api/agencies/${code}`); toast.success('Supprimée'); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('agencies_admin_title')}</h2>
          <p className="text-slate-500 text-sm">{t('agencies_subtitle')}</p>
        </div>
        <button onClick={() => setOpen(true)} data-testid="new-agency-btn" className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-slate-800"><Plus className="h-4 w-4" /> {t('new_agency')}</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agencies.map(a => (
          <div key={a.code} data-testid={`agency-card-${a.code}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm card-hover">
            <div className="flex items-start justify-between">
              <div className="bg-orange-50 text-orange-600 p-2 rounded-lg"><Building2 className="h-5 w-5" /></div>
              <button onClick={() => remove(a.code)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 font-mono text-xs text-slate-400">{a.code}</div>
            <div className="font-semibold text-slate-900">{a.name}</div>
            <div className="text-sm text-slate-500">{a.city}, {a.country}</div>
            {a.phone && <div className="text-xs text-slate-400 font-mono mt-1">{a.phone}</div>}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('new_agency')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <F label={t('col_code')} v={form.code} on={v => setForm({ ...form, code: v })} testid="ag-code" />
            <F label={t('col_name')} v={form.name} on={v => setForm({ ...form, name: v })} testid="ag-name" />
            <F label={t('col_city')} v={form.city} on={v => setForm({ ...form, city: v })} testid="ag-city" />
            <F label={t('col_country')} v={form.country} on={v => setForm({ ...form, country: v })} testid="ag-country" />
            <F label={t('col_phone')} v={form.phone} on={v => setForm({ ...form, phone: v })} testid="ag-phone" />
            <F label={t('city_address')} v={form.address} on={v => setForm({ ...form, address: v })} testid="ag-address" />
          </div>
          <DialogFooter><button onClick={create} data-testid="ag-save" className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700">{t('create')}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const F = ({ label, v, on, testid }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-semibold uppercase text-slate-500">{label}</label>
    <input value={v} data-testid={testid} onChange={e => on(e.target.value)} className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-orange-600" />
  </div>
);
