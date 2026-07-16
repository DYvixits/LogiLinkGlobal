import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FileText, Download, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const eur = (n, c = '€') => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${c}`;

const INV_BADGE = { paid: 'bg-green-100 text-green-700', partial: 'bg-amber-100 text-amber-700', unpaid: 'bg-red-100 text-red-700' };

export default function InvoicesView() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [open, setOpen] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [discount, setDiscount] = useState('0');

  const load = () => axios.get(`${BACKEND_URL}/api/invoices`).then(r => setInvoices(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/invoices`, { tracking_id: trackingId.trim(), discount_percent: parseFloat(discount) || 0 });
      toast.success('Facture créée'); setOpen(false); setTrackingId(''); setDiscount('0'); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Erreur facturation'); }
  };

  const pay = async (inv) => {
    const amount = parseFloat(window.prompt(`${t('amount_label')} (${t('col_total')}: ${inv.total} ${inv.currency})`, String(inv.total - inv.amount_paid)));
    if (!amount || amount <= 0) return;
    try { await axios.patch(`${BACKEND_URL}/api/invoices/${inv.invoice_number}/pay?amount=${amount}`); toast.success('Paiement enregistré'); load(); }
    catch { toast.error('Erreur paiement'); }
  };

  const statusLabel = (s) => t(`inv_${s}`) || s;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('invoices_title')}</h2>
          <p className="text-slate-500 text-sm">{t('invoices_subtitle')}</p>
        </div>
        <button onClick={() => setOpen(true)} data-testid="new-invoice-btn" className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-orange-700"><Plus className="h-4 w-4" /> {t('new_invoice')}</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 px-4 font-medium">{t('col_invoice')}</th>
                <th className="py-3 px-4 font-medium hidden md:table-cell">{t('col_client')}</th>
                <th className="py-3 px-4 font-medium text-right">{t('col_total')}</th>
                <th className="py-3 px-4 font-medium text-center">{t('col_inv_status')}</th>
                <th className="py-3 px-4 font-medium text-right">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.invoice_number} data-testid={`invoice-row-${inv.invoice_number}`} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-mono font-semibold text-slate-900">{inv.invoice_number}</div>
                    <div className="text-xs text-orange-600 font-mono">{inv.tracking_id}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-slate-600">{inv.client?.name}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">{eur(inv.total, inv.currency)}</td>
                  <td className="py-3 px-4 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${INV_BADGE[inv.status]}`}>{statusLabel(inv.status)}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`${BACKEND_URL}/api/invoices/${inv.invoice_number}/pdf`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50" title={t('download')}><Download className="h-3.5 w-3.5 text-slate-600" /></a>
                      {inv.status !== 'paid' && <button onClick={() => pay(inv)} data-testid={`pay-${inv.invoice_number}`} className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700">{t('pay')}</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />—</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('new_invoice')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500">{t('tracking_id_label')}</label>
              <input value={trackingId} onChange={e => setTrackingId(e.target.value)} data-testid="inv-tracking" placeholder="LOGI-XXXXXX" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-orange-600" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500">{t('discount_label')} (%)</label>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} data-testid="inv-discount" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
            </div>
            <p className="text-xs text-slate-400">{t('invoice_hint')}</p>
          </div>
          <DialogFooter>
            <button onClick={create} data-testid="inv-create" className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800">{t('create')}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
