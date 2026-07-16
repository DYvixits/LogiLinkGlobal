import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plug, Plus, Copy, Ban, Code2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function IntegrationsView() {
  const { t } = useLanguage();
  const [keys, setKeys] = useState([]);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');

  const load = () => axios.get(`${BACKEND_URL}/api/integrations/keys`).then(r => setKeys(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    try { await axios.post(`${BACKEND_URL}/api/integrations/keys`, { label: label.trim() || 'Boutique' }); toast.success('Clé créée'); setOpen(false); setLabel(''); load(); }
    catch { toast.error('Erreur'); }
  };
  const revoke = async (k) => { if (!window.confirm('Révoquer ?')) return; await axios.delete(`${BACKEND_URL}/api/integrations/keys/${k}`); toast.success('Révoquée'); load(); };
  const copy = (txt) => { navigator.clipboard?.writeText(txt); toast.success('Copié'); };

  const endpoint = `${BACKEND_URL}/api/integrations/shipments`;
  const payload = `{
  "direction": "EU_TO_CM",
  "sender": { "name": "Ma Boutique", "phone": "+39...", "city": "Lodi" },
  "receiver": { "name": "Client", "phone": "+237...", "city": "Douala" },
  "content_description": "Commande #1234",
  "weight_kg": 3.5,
  "external_order_id": "1234"
}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('integrations_title')}</h2>
          <p className="text-slate-500 text-sm">{t('integrations_subtitle')}</p>
        </div>
        <button onClick={() => setOpen(true)} data-testid="new-key-btn" className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-orange-700"><Plus className="h-4 w-4" /> {t('new_key')}</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {keys.map((k, i) => (
            <div key={i} className="flex items-center justify-between p-4" data-testid={`apikey-row-${i}`}>
              <div className="min-w-0">
                <div className="font-medium text-slate-900 flex items-center gap-2"><Plug className="h-4 w-4 text-orange-600" /> {k.label}</div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono text-slate-500 truncate max-w-[220px]">{k.key}</code>
                  <button onClick={() => copy(k.key)} className="text-slate-400 hover:text-slate-700"><Copy className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {k.active
                ? <button onClick={() => revoke(k.key)} className="text-xs text-red-500 flex items-center gap-1 hover:text-red-700"><Ban className="h-3.5 w-3.5" /> {t('revoke')}</button>
                : <span className="text-xs text-slate-400">{t('revoked')}</span>}
            </div>
          ))}
          {keys.length === 0 && <div className="p-10 text-center text-slate-400 text-sm">{t('no_keys')}</div>}
        </div>

        <div className="bg-slate-900 rounded-xl p-6 text-slate-200 text-sm">
          <div className="flex items-center gap-2 font-semibold text-white mb-4"><Code2 className="h-4 w-4 text-orange-500" /> {t('api_doc')}</div>
          <p className="text-slate-400 mb-3 text-xs">{t('api_doc_intro')}</p>
          <div className="space-y-2 font-mono text-xs">
            <div><span className="text-orange-400">POST</span> <span className="text-slate-300 break-all">{endpoint}</span></div>
            <div className="text-slate-400">Header: <span className="text-slate-200">X-API-Key: sk_live_...</span></div>
          </div>
          <pre className="mt-3 bg-black/40 rounded-lg p-3 text-xs overflow-x-auto text-green-300">{payload}</pre>
          <p className="text-slate-400 mt-3 text-xs">{t('api_doc_response')}</p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('new_key')}</DialogTitle></DialogHeader>
          <div className="py-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500">{t('key_label')}</label>
            <input value={label} onChange={e => setLabel(e.target.value)} data-testid="key-label" placeholder="Ma boutique Shopify" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
          </div>
          <DialogFooter><button onClick={create} data-testid="key-create" className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800">{t('create')}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
