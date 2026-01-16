import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

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
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/parcels/${id}`);
      setResult(res.data);
    } catch (err) {
      setError(t('invalid_id'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idFromUrl) {
        fetchTracking(idFromUrl);
    }
  }, [idFromUrl]);

  const handleSearch = (e) => {
      e.preventDefault();
      if(trackId) fetchTracking(trackId);
  }

  const getStatusStep = (status) => {
      const steps = ["REGISTERED", "RECEIVED_AT_DEPOT", "IN_TRANSIT", "ARRIVED", "DELIVERED"];
      return steps.indexOf(status);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-heading font-bold mb-8 text-center">{t('track_parcel')}</h1>
        
        <form onSubmit={handleSearch} className="flex max-w-lg mx-auto mb-12 shadow-lg">
           <input 
             type="text" 
             placeholder="LOGI-XXXXXX" 
             className="flex-1 border-2 border-r-0 border-slate-200 p-4 focus:border-slate-900 outline-none font-mono text-lg"
             value={trackId}
             onChange={e => setTrackId(e.target.value)}
           />
           <button type="submit" className="bg-accent text-white font-bold px-8 hover:bg-orange-700 transition-colors uppercase">
             {t('search')}
           </button>
        </form>

        {loading && <div className="text-center p-8">{t('loading')}</div>}
        
        {error && (
            <div className="bg-red-50 text-red-600 p-4 border border-red-200 text-center font-bold flex items-center justify-center gap-2">
                <AlertCircle /> {error}
            </div>
        )}

        {result && (
            <div className="bg-white border border-slate-200 shadow-sm">
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <p className="text-slate-400 text-sm uppercase tracking-wider">{t('tracking_num')}</p>
                        <p className="font-mono text-2xl font-bold text-accent">{result.tracking_id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm uppercase tracking-wider">{t('est_arrival')}</p>
                        <p className="font-mono text-xl">{new Date(result.estimated_arrival).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="p-8">
                    {/* Status Steps */}
                    <div className="relative flex justify-between mb-12 mt-4">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2" />
                        <div className={cn("absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 transition-all duration-1000", 
                            `w-[${(getStatusStep(result.status) / 4) * 100}%]`)} />

                        {[
                            { id: "REGISTERED", label: t('step_registered') },
                            { id: "RECEIVED_AT_DEPOT", label: t('step_depot') },
                            { id: "IN_TRANSIT", label: t('step_transit') },
                            { id: "ARRIVED", label: t('step_arrived') },
                            { id: "DELIVERED", label: t('step_delivered') }
                        ].map((step, idx) => {
                            const isCompleted = getStatusStep(result.status) >= idx;
                            const isCurrent = result.status === step.id;
                            
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                                        isCompleted ? "bg-green-500 border-green-500 text-white" : "bg-white border-slate-200 text-slate-300"
                                    )}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 bg-current rounded-full"/>}
                                    </div>
                                    <span className={cn("text-xs font-bold uppercase", isCurrent ? "text-slate-900" : "text-slate-400")}>
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                        <div>
                            <h3 className="font-heading font-bold text-lg mb-4 text-slate-900">{t('details_shipment')}</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">{t('from')}:</span>
                                    <span className="font-medium">{result.sender.city}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">{t('to')}:</span>
                                    <span className="font-medium">{result.receiver.city}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">{t('content')}:</span>
                                    <span className="font-medium">{result.content_description}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                             <h3 className="font-heading font-bold text-lg mb-4 text-slate-900">{t('contact_info')}</h3>
                             <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">{t('sender')}:</span>
                                    <span className="font-medium">{result.sender.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">{t('receiver')}:</span>
                                    <span className="font-medium">{result.receiver.name}</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
