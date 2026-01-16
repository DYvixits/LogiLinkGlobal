import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, formData);
      
      // Store token and user info
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('user_name', res.data.full_name);
      
      toast.success(`Bienvenue ${res.data.full_name}`);
      navigate('/backoffice');
    } catch (err) {
      toast.error('Identifiants incorrects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 shadow-2xl border-t-4 border-accent">
        <div className="text-center mb-8">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-slate-900" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">LOGILINK GLOBAL</h1>
          <p className="text-slate-500 font-medium">Accès Opérateur & Administration</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
              <User className="h-4 w-4" /> Identifiant
            </label>
            <input 
              type="text" 
              required
              className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium"
              placeholder="Ex: admin, operateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
              <Lock className="h-4 w-4" /> Mot de passe
            </label>
            <input 
              type="password" 
              required
              className="w-full border-2 border-slate-200 p-3 focus:border-slate-900 outline-none font-medium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent text-white font-bold py-4 hover:bg-orange-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Se Connecter'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>Support Technique: support@logilink.com</p>
        </div>
      </div>
    </div>
  );
}
