import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { User, Lock, Loader2, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, formData);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('user_name', res.data.full_name);
      toast.success(`${t('welcome')} ${res.data.full_name}`);
      navigate('/backoffice');
    } catch (err) {
      toast.error(t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-700/40 rounded-full blur-3xl" />

      <button
        onClick={toggleLanguage}
        data-testid="language-toggle-button"
        className="absolute top-6 right-6 z-10 flex items-center gap-1.5 text-xs font-semibold uppercase text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
      >
        <Globe className="h-3.5 w-3.5" /> {language}
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="LOGILINK GLOBAL" className="h-16 w-auto mb-4" />
          <h1 className="text-3xl font-heading font-bold text-white">{t('login_title')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-2xl space-y-5" data-testid="login-form">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {t('login_id')}</label>
            <input
              data-testid="login-username"
              type="text" required value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> {t('login_pass')}</label>
            <input
              data-testid="login-password"
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all outline-none"
            />
          </div>
          <button
            data-testid="login-submit"
            type="submit" disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-all hover:-translate-y-[1px] shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('login_btn')}
          </button>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm">
            <p className="font-semibold text-slate-700 mb-1">{t('demo_access')}</p>
            <p className="text-slate-500"><span className="font-semibold">Admin :</span> admin / admin123</p>
            <p className="text-slate-500"><span className="font-semibold">Opérateur :</span> operateur / op123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
