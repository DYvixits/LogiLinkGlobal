import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { ArrowLeft, Check, Download, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Send() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const direction = searchParams.get('dir') || 'EU_TO_CM';
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  
  const [formData, setFormData] = useState({
    direction: direction,
    sender: { name: '', phone: '', city: '', address: '' },
    receiver: { name: '', phone: '', city: '', address: '' },
    content_description: '',
    departure_date: new Date().toISOString().split('T')[0] // Default today
  });

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const FIXED_ITALY_ADDRESS = {
    name: "Simo Patrice",
    address_base: "Via Roma 35",
    postal_code: "26866",
    city: "Lodi",
    country: "Italie",
    full_address: "Via Roma 35, 26866 Lodi, Italie"
  };

  const isItalySide = (section) => {
    if (direction === 'EU_TO_CM' && section === 'sender') return true;
    if (direction === 'CM_TO_EU' && section === 'receiver') return true;
    return false;
  };

  useEffect(() => {
    // Pre-fill Italy side data
    if (direction === 'EU_TO_CM') {
        setFormData(prev => ({
            ...prev,
            sender: { 
                ...prev.sender, 
                name: FIXED_ITALY_ADDRESS.name,
                city: `${FIXED_ITALY_ADDRESS.postal_code} ${FIXED_ITALY_ADDRESS.city}, ${FIXED_ITALY_ADDRESS.country}`,
                address: FIXED_ITALY_ADDRESS.address_base
            }
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            receiver: { 
                ...prev.receiver, 
                name: FIXED_ITALY_ADDRESS.name,
                city: `${FIXED_ITALY_ADDRESS.postal_code} ${FIXED_ITALY_ADDRESS.city}, ${FIXED_ITALY_ADDRESS.country}`,
                address: FIXED_ITALY_ADDRESS.address_base
            }
        }));
    }
  }, [direction]);

  const [complement, setComplement] = useState("");

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
      setStep(3); // Success Step
    } catch (err) {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
     return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
           <div className="bg-white p-8 max-w-lg w-full border-2 border-slate-900 shadow-xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-heading font-bold mb-2">COLIS ENREGISTRÉ !</h2>
              <p className="text-slate-600 mb-8">Votre numéro de suivi est : <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1">{successData.tracking_id}</span></p>
              
              <div className="space-y-4">
                 <a 
                    href={`${BACKEND_URL}/api/parcels/${successData.tracking_id}/pdf`} 
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full bg-accent text-white font-bold uppercase py-4 hover:bg-orange-700 transition-colors"
                 >
                    <Download className="h-5 w-5" /> Télécharger le Ticket
                 </a>
                 <button onClick={() => navigate('/')} className="w-full text-slate-500 font-medium hover:text-slate-900">
                    Retour à l'accueil
                 </button>
              </div>
              
              <p className="mt-8 text-xs text-slate-400 max-w-xs mx-auto">
                 Veuillez imprimer ce ticket et le coller sur votre colis avant de le déposer au point de collecte.
              </p>
           </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="container py-12 max-w-3xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-medium">
           <ArrowLeft className="h-4 w-4" /> Retour
        </button>
      
        <h1 className="text-4xl font-heading font-bold mb-2">ENREGISTRER UN COLIS</h1>
        <p className="text-slate-600 mb-8 font-medium">Direction: {direction === 'EU_TO_CM' ? 'EUROPE -> CAMEROUN' : 'CAMEROUN -> EUROPE'}</p>
        
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-8 shadow-sm">
           
           {/* Section Expéditeur */}
           <div className="mb-8">
              <h3 className="font-heading text-xl font-bold bg-slate-100 p-2 border-l-4 border-slate-900 mb-4">1. EXPÉDITEUR</h3>
              {isItalySide('sender') ? (
                  <div className="bg-slate-50 p-6 border-2 border-slate-200 border-dashed">
                      <div className="mb-4">
                          <p className="text-sm font-bold text-slate-500 uppercase">Adresse de dépôt (Fixe)</p>
                          <p className="font-heading text-2xl font-bold text-slate-900">{FIXED_ITALY_ADDRESS.name}</p>
                          <p className="font-mono text-slate-700">{FIXED_ITALY_ADDRESS.full_address}</p>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Complément d'adresse (Optionnel)</label>
                          <input type="text" placeholder="Ex: Batiment B, Etage 2..." className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium"
                             value={complement} onChange={e => handleComplementChange(e.target.value)} />
                      </div>
                  </div>
              ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom Complet</label>
                        <input required type="text" className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium" 
                           value={formData.sender.name} onChange={e => handleChange('sender', 'name', e.target.value)} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Téléphone</label>
                        <input required type="tel" className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium" 
                           value={formData.sender.phone} onChange={e => handleChange('sender', 'phone', e.target.value)} />
                     </div>
                     <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ville & Adresse</label>
                        <input required type="text" className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium" 
                           value={formData.sender.city} onChange={e => handleChange('sender', 'city', e.target.value)} />
                     </div>
                  </div>
              )}
           </div>

           {/* Section Destinataire */}
           <div className="mb-8">
              <h3 className="font-heading text-xl font-bold bg-slate-100 p-2 border-l-4 border-accent mb-4">2. DESTINATAIRE</h3>
              <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom Complet</label>
                    <input required type="text" className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium" 
                       value={formData.receiver.name} onChange={e => handleChange('receiver', 'name', e.target.value)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Téléphone</label>
                    <input required type="tel" className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium" 
                       value={formData.receiver.phone} onChange={e => handleChange('receiver', 'phone', e.target.value)} />
                 </div>
                 <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ville & Adresse</label>
                    <input required type="text" className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium" 
                       value={formData.receiver.city} onChange={e => handleChange('receiver', 'city', e.target.value)} />
                 </div>
              </div>
           </div>

           {/* Détails */}
           <div className="mb-8">
              <h3 className="font-heading text-xl font-bold bg-slate-100 p-2 border-l-4 border-slate-400 mb-4">3. COLIS</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description du contenu</label>
                    <textarea required rows="3" className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium" 
                       value={formData.content_description} onChange={e => handleChange(null, 'content_description', e.target.value)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date de dépôt prévue</label>
                    <input required type="date" className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium" 
                       value={formData.departure_date} onChange={e => handleChange(null, 'departure_date', e.target.value)} />
                 </div>
              </div>
           </div>
           
           <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white font-bold py-4 text-lg hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : 'Générer mon ticket'}
           </button>

        </form>
      </div>
    </div>
  );
}
