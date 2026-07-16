import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { ArrowLeft, Check, Download, Loader2, MapPin, User, Package } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FIXED_ITALY_ADDRESS = {
  name: "Simo Patrice",
  address_base: "Via Roma 35",
  postal_code: "26866",
  city: "Lodi",
  country: "Italie",
  phone: "+39 3287091255",
  full_address: "Via Roma 35, 26866 Lodi, Italie",
};

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all outline-none";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-slate-500";

export default function Send() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const direction = searchParams.get('dir') || 'EU_TO_CM';

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [complement, setComplement] = useState("");

  const [formData, setFormData] = useState({
    direction,
    sender: { name: '', phone: '', city: '', address: '' },
    receiver: { name: '', phone: '', city: '', address: '' },
    content_description: '',
    departure_date: new Date().toISOString().split('T')[0],
  });

  const handleChange = (section, field, value) => {
    if (section) setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    else setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isItalySide = (section) =>
    (direction === 'EU_TO_CM' && section === 'sender') || (direction === 'CM_TO_EU' && section === 'receiver');

  useEffect(() => {
    const side = direction === 'EU_TO_CM' ? 'sender' : 'receiver';
    setFormData(prev => ({
      ...prev,
      direction,
      [side]: {
        ...prev[side],
        name: FIXED_ITALY_ADDRESS.name,
        phone: FIXED_ITALY_ADDRESS.phone,
        city: `${FIXED_ITALY_ADDRESS.postal_code} ${FIXED_ITALY_ADDRESS.city}, ${FIXED_ITALY_ADDRESS.country}`,
        address: FIXED_ITALY_ADDRESS.address_base,
      },
    }));
  }, [direction]);

  const handleComplementChange = (val) => {
    setComplement(val);
    const side = direction === 'EU_TO_CM' ? 'sender' : 'receiver';
    const base = FIXED_ITALY_ADDRESS.address_base;
    handleChange(side, 'address', val ? `${base}, ${val}` : base);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/parcels`, formData);
      setSuccessData(res.data);
    } catch (err) {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally { setLoading(false); }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full border border-slate-200 shadow-xl text-center animate-fade-in" data-testid="send-success">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-2 text-slate-900">{t('success_title')}</h2>
          <p className="text-slate-600 mb-8">{t('your_tracking_id')} <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{successData.tracking_id}</span></p>
          <div className="space-y-3">
            <a
              href={`${BACKEND_URL}/api/parcels/${successData.tracking_id}/pdf`}
              target="_blank" rel="noreferrer"
              data-testid="download-ticket-btn"
              className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white font-semibold py-3.5 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Download className="h-5 w-5" /> {t('download_ticket')}
            </a>
            <button onClick={() => navigate('/')} className="w-full text-slate-500 font-medium hover:text-slate-900 py-2">{t('back_home')}</button>
          </div>
          <p className="mt-8 text-xs text-slate-400 max-w-xs mx-auto">{t('print_instruction')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container py-12 max-w-3xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium text-sm" data-testid="send-back">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </button>

        <h1 className="text-4xl font-heading font-bold mb-2 text-slate-900">{t('register_parcel')}</h1>
        <p className="text-slate-500 mb-8 flex items-center gap-2">
          <Package className="h-4 w-4 text-orange-600" />
          {direction === 'EU_TO_CM' ? t('direction_eu_cm') : t('direction_cm_eu')}
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8" data-testid="send-form">
          <Section title={`1. ${t('sender')}`} accent>
            {isItalySide('sender') ? <FixedAddress label={t('fixed_address_depot')} complement={complement} onChange={handleComplementChange} t={t} /> :
              <Fields section="sender" data={formData.sender} onChange={handleChange} t={t} />}
          </Section>

          <Section title={`2. ${t('receiver')}`}>
            {isItalySide('receiver') ? <FixedAddress label={t('fixed_address_receipt')} complement={complement} onChange={handleComplementChange} t={t} /> :
              <Fields section="receiver" data={formData.receiver} onChange={handleChange} t={t} />}
          </Section>

          <Section title={`3. ${t('parcel_info')}`}>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>{t('content_desc')}</label>
                <textarea required rows="3" data-testid="send-content" className={inputCls}
                  value={formData.content_description} onChange={e => handleChange(null, 'content_description', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>{t('dep_date')}</label>
                <input required type="date" data-testid="send-date" className={inputCls}
                  value={formData.departure_date} onChange={e => handleChange(null, 'departure_date', e.target.value)} />
              </div>
            </div>
          </Section>

          <button disabled={loading} type="submit" data-testid="send-submit"
            className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-lg hover:bg-slate-800 transition-all hover:-translate-y-[1px] flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('generate_ticket')}
          </button>
        </form>
      </div>
    </div>
  );
}

const Section = ({ title, accent, children }) => (
  <div>
    <h3 className={`font-heading text-lg font-bold mb-4 pl-3 border-l-4 ${accent ? 'border-orange-600' : 'border-slate-900'} text-slate-900`}>{title}</h3>
    {children}
  </div>
);

const Fields = ({ section, data, onChange, t }) => (
  <div className="grid md:grid-cols-2 gap-4">
    <div className="space-y-1">
      <label className={labelCls}>{t('name')}</label>
      <input required type="text" data-testid={`send-${section}-name`} className={inputCls} value={data.name} onChange={e => onChange(section, 'name', e.target.value)} />
    </div>
    <div className="space-y-1">
      <label className={labelCls}>{t('phone')}</label>
      <input required type="tel" data-testid={`send-${section}-phone`} className={inputCls} value={data.phone} onChange={e => onChange(section, 'phone', e.target.value)} />
    </div>
    <div className="space-y-1 md:col-span-2">
      <label className={labelCls}>{t('city_address')}</label>
      <input required type="text" data-testid={`send-${section}-city`} className={inputCls} value={data.city} onChange={e => onChange(section, 'city', e.target.value)} />
    </div>
  </div>
);

const FixedAddress = ({ label, complement, onChange, t }) => (
  <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-slate-300" data-testid="fixed-italy-address">
    <div className="mb-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-600" /> {label}</p>
      <p className="font-heading text-2xl font-bold text-slate-900 mt-1">{FIXED_ITALY_ADDRESS.name}</p>
      <p className="font-mono text-sm text-slate-700">{FIXED_ITALY_ADDRESS.full_address}</p>
      <p className="font-mono text-sm text-slate-900 font-bold">{FIXED_ITALY_ADDRESS.phone}</p>
    </div>
    <div className="space-y-1">
      <label className={labelCls}>{t('complement_addr')}</label>
      <input type="text" placeholder="Ex: Bâtiment B, Étage 2..." data-testid="send-complement" className={inputCls}
        value={complement} onChange={e => onChange(e.target.value)} />
    </div>
  </div>
);
