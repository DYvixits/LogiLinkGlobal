import React, { useState, useEffect } from 'react';
import { Header } from '../components/ui/Header';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Backoffice() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParcels = async () => {
      try {
          const res = await axios.get(`${BACKEND_URL}/api/parcels`);
          setParcels(res.data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  }

  useEffect(() => {
      fetchParcels();
  }, []);

  const updateStatus = async (id, newStatus) => {
      try {
          await axios.patch(`${BACKEND_URL}/api/parcels/${id}/status?status=${newStatus}`);
          fetchParcels(); // Refresh
      } catch (e) {
          alert("Erreur update");
      }
  }

  return (
    <div className="min-h-screen bg-slate-100">
        <Header />
        <div className="container py-8">
            <h1 className="text-3xl font-heading font-bold mb-6">ESPACE OPÉRATEUR</h1>
            
            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-white uppercase font-bold">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">ID Suivi</th>
                            <th className="p-4">De -> Vers</th>
                            <th className="p-4">Expéditeur</th>
                            <th className="p-4">Statut</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {parcels.map(p => (
                            <tr key={p.tracking_id} className="hover:bg-slate-50">
                                <td className="p-4">{new Date(p.created_at).toLocaleDateString()}</td>
                                <td className="p-4 font-mono font-bold text-accent">{p.tracking_id}</td>
                                <td className="p-4">
                                    {p.direction === 'EU_TO_CM' ? '🇪🇺 -> 🇨🇲' : '🇨🇲 -> 🇪🇺'}
                                </td>
                                <td className="p-4">{p.sender.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                                        p.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                                        p.status === 'REGISTERED' ? 'bg-gray-100 text-gray-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <select 
                                        className="border p-1 rounded text-xs"
                                        value={p.status}
                                        onChange={(e) => updateStatus(p.tracking_id, e.target.value)}
                                    >
                                        <option value="REGISTERED">ENREGISTRÉ</option>
                                        <option value="RECEIVED_AT_DEPOT">AU DÉPÔT</option>
                                        <option value="IN_TRANSIT">EN TRANSIT</option>
                                        <option value="ARRIVED">ARRIVÉ</option>
                                        <option value="DELIVERED">LIVRÉ</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-8 text-center">Chargement...</div>}
            </div>
        </div>
    </div>
  )
}
