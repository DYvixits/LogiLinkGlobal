import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { Search, AlertCircle, Loader2, MapPin, Package, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Tracking() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get('id');
  const [trackId, setTrackId] = useState(idFromUrl || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTracking = async (id) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/parcels/${id}`);
      setResult(res.data);
    } catch {
      setError(t('invalid_id'));
    } finally { setLoading(false); }
  };

  useEffect(() => { if (idFromUrl) fetchTracking(idFromUrl); }, [idFromUrl]);

  const handleSearch = (e) => { e.preventDefault(); if (trackId) fetchTracking(trackId); };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-3">{t('track_parcel')}</h1>
          <p className="text-slate-500 max-w-lg mx-auto">{t('track_intro')}</p>
        </div>

        <form onSubmit={handleSearch} className="flex max-w-lg mx-auto mb-10 bg-white rounded-xl border border-slate-200 shadow-sm p-1.5" data-testid="track-form">
          <input
            type="text"
            data-testid="track-input"
            placeholder="LOGI-XXXXXX"
            className="flex-1 bg-transparent px-4 py-2.5 focus:outline-none font-mono text-slate-900 placeholder:text-slate-400"
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
          />
          <button type="submit" data-testid="track-submit" className="bg-orange-600 text-white font-semibold px-6 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
            <Search className="h-4 w-4" /> {t('search')}
          </button>
        </form>

        {loading && <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>}

        {error && (
          <div className="max-w-lg mx-auto bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center font-medium flex items-center justify-center gap-2" data-testid="track-error">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in" data-testid="track-result">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">{t('tracking_num')}</p>
                <p className="font-mono text-2xl font-bold text-orange-500">{result.tracking_id}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">{t('est_arrival')}</p>
                  <p className="font-mono text-lg">{new Date(result.estimated_arrival).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={result.status} className="text-sm px-3 py-1" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-5">{t('timeline_title')}</h3>
                <Timeline parcel={result} />
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">{t('details_shipment')}</h3>
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <span className="flex items-center gap-1.5 text-slate-700"><MapPin className="h-4 w-4 text-orange-600" /> {result.sender.city}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <span className="flex items-center gap-1.5 text-slate-700"><MapPin className="h-4 w-4 text-slate-900" /> {result.receiver.city}</span>
                  </div>
                  <Row label={t('content')} value={result.content_description} />
                  {result.weight_kg > 0 && <Row label={t('weight')} value={`${result.weight_kg} kg`} />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">{t('contact_info')}</h3>
                  <Row label={t('sender')} value={result.sender.name} />
                  <Row label={t('receiver')} value={result.receiver.name} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-slate-50 py-2 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-900">{value}</span>
  </div>
);
