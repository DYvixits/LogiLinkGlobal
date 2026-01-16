import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, CheckCircle2, MapPin, Package, Search } from 'lucide-react';
import { Header } from '../components/ui/Header';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Home() {
  const [schedule, setSchedule] = useState({ eu_to_cm: [], cm_to_eu: [] });
  const [trackId, setTrackId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/schedule`)
      .then(res => setSchedule(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleTrack = (e) => {
    e.preventDefault();
    if(trackId) navigate(`/track?id=${trackId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1738194942064-826a6219e5cb?q=80&w=2070&auto=format&fit=crop" 
            alt="Maritime Logistics" 
            className="w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white leading-tight">
              LIAISON DIRECTE <br/>
              <span className="text-accent">EUROPE - CAMEROUN</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-lg">
              La solution logistique fiable, sans inscription. Déposez, on s'occupe du reste. Départs hebdomadaires garantis.
            </p>
            
            <form onSubmit={handleTrack} className="flex max-w-md bg-white p-1">
              <input 
                type="text" 
                placeholder="N° DE SUIVI (ex: LOGI-123456)" 
                className="flex-1 bg-transparent border-none px-4 py-3 focus:ring-0 text-slate-900 placeholder:text-slate-400 font-mono"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <button type="submit" className="bg-accent text-white px-6 font-bold hover:bg-orange-700 transition-colors uppercase">
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
          
          {/* Status Board - Right Side */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 text-white">
            <h3 className="font-heading text-2xl mb-6 flex items-center gap-2">
              <Calendar className="text-accent" /> PROCHAINS DÉPARTS
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold flex items-center gap-2"><MapPin className="h-4 w-4"/> EUROPE &rarr; CAMEROUN</span>
                  <span className="text-xs bg-accent px-2 py-1 uppercase font-bold">Vendredis</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                   {schedule.eu_to_cm.slice(0,4).map((date, i) => (
                      <div key={i} className="bg-white/10 p-2 text-center text-sm font-mono border border-white/10">
                        {new Date(date).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})}
                      </div>
                   ))}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold flex items-center gap-2"><MapPin className="h-4 w-4"/> CAMEROUN &rarr; EUROPE</span>
                  <span className="text-xs bg-slate-700 px-2 py-1 uppercase font-bold">Samedis</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                   {schedule.cm_to_eu.slice(0,4).map((date, i) => (
                      <div key={i} className="bg-white/10 p-2 text-center text-sm font-mono border border-white/10">
                        {new Date(date).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})}
                      </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Actions */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <Link to="/send?dir=EU_TO_CM" className="group relative h-64 bg-slate-100 hover:bg-slate-900 transition-all duration-500 overflow-hidden border-2 border-slate-200 hover:border-slate-900 flex flex-col justify-center items-center text-center p-8">
              <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/4484078/pexels-photo-4484078.jpeg')] bg-cover bg-center opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              <div className="z-10">
                 <h2 className="text-4xl font-heading font-bold text-slate-900 group-hover:text-white mb-2 transition-colors">JE VEUX ENVOYER</h2>
                 <p className="text-lg text-slate-600 group-hover:text-slate-300 font-medium mb-6 transition-colors">DE L'EUROPE VERS LE CAMEROUN</p>
                 <span className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-widest border-b-2 border-accent pb-1">Commencer <ArrowRight className="h-4 w-4"/></span>
              </div>
            </Link>

            <Link to="/send?dir=CM_TO_EU" className="group relative h-64 bg-slate-100 hover:bg-slate-900 transition-all duration-500 overflow-hidden border-2 border-slate-200 hover:border-slate-900 flex flex-col justify-center items-center text-center p-8">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1761926002909-781a45b71030')] bg-cover bg-center opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
               <div className="z-10">
                 <h2 className="text-4xl font-heading font-bold text-slate-900 group-hover:text-white mb-2 transition-colors">JE VEUX ENVOYER</h2>
                 <p className="text-lg text-slate-600 group-hover:text-slate-300 font-medium mb-6 transition-colors">DU CAMEROUN VERS L'EUROPE</p>
                 <span className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-widest border-b-2 border-accent pb-1">Commencer <ArrowRight className="h-4 w-4"/></span>
               </div>
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto py-12 bg-slate-900 text-slate-400 text-center">
        <p className="font-mono text-sm">LOGILINK GLOBAL &copy; 2025. TRANSPORT MARITIME ET AÉRIEN.</p>
      </footer>
    </div>
  );
}
