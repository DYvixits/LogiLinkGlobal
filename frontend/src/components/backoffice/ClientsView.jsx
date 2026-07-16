import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserRound, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { StatusBadge } from '../StatusBadge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const eur = (n) => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;

export default function ClientsView() {
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => { axios.get(`${BACKEND_URL}/api/clients`).then(r => setClients(r.data)).catch(() => {}); }, []);

  const openClient = async (c) => {
    const res = await axios.get(`${BACKEND_URL}/api/clients/${encodeURIComponent(c.phone)}`);
    setDetail({ ...c, parcels: res.data.parcels });
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-heading font-bold text-slate-900">{t('clients_title')}</h2>
        <p className="text-slate-500 text-sm">{t('clients_subtitle')}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 px-4 font-medium">{t('name')}</th>
                <th className="py-3 px-4 font-medium hidden sm:table-cell">{t('phone')}</th>
                <th className="py-3 px-4 font-medium hidden md:table-cell">{t('city_address')}</th>
                <th className="py-3 px-4 font-medium text-center">{t('col_parcels_count')}</th>
                <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">{t('col_total_spent')}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={i} data-testid={`client-row-${i}`} onClick={() => openClient(c)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2"><UserRound className="h-4 w-4 text-orange-600" /> {c.name}</td>
                  <td className="py-3 px-4 hidden sm:table-cell font-mono text-slate-500 text-xs">{c.phone}</td>
                  <td className="py-3 px-4 hidden md:table-cell text-slate-500">{c.city || '—'}</td>
                  <td className="py-3 px-4 text-center"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-medium">{c.parcels}</span></td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell font-medium text-slate-700">{eur(c.total_spent)}</td>
                </tr>
              ))}
              {clients.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">—</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-orange-600" /> {detail.name}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat label={t('col_parcels_count')} value={detail.parcels?.length || detail.parcels} />
                <Stat label={t('col_total_spent')} value={eur(detail.total_spent)} />
                <Stat label={t('kpi_weight')} value={`${detail.total_weight} kg`} />
              </div>
              <div className="text-xs text-slate-500 mb-3 font-mono">{detail.phone} · {detail.city || ''} {detail.country || ''}</div>
              <div className="space-y-2">
                {(detail.parcels || []).map(p => (
                  <div key={p.tracking_id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3 text-sm">
                    <div>
                      <span className="font-mono font-semibold text-orange-600">{p.tracking_id}</span>
                      <span className="text-xs text-slate-500 ml-2">{p.sender?.city} → {p.receiver?.city}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="bg-slate-50 rounded-lg p-3 text-center">
    <div className="text-lg font-heading font-bold text-slate-900">{value}</div>
    <div className="text-[10px] uppercase text-slate-500">{label}</div>
  </div>
);
