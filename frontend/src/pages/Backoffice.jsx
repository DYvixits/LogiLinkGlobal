import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  LayoutDashboard, Package, Users, ScrollText, LogOut, PlusCircle, Search,
  RefreshCw, Truck, CheckCircle2, TrendingUp, Wallet, Weight, Box, UserRound,
  AlertTriangle, Clock, User, Shield, X, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { ALL_STATUSES } from '../lib/status';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const eur = (n) => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;

export default function Backoffice() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState({ name: '', role: '' });
  const [parcels, setParcels] = useState([]);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [selected, setSelected] = useState([]);

  // Modals
  const [detail, setDetail] = useState(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [recWeight, setRecWeight] = useState('');
  const [recPrice, setRecPrice] = useState('');
  const [newParcelOpen, setNewParcelOpen] = useState(false);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newParcel, setNewParcel] = useState(initParcel());
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'operator' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setUser({ name: localStorage.getItem('user_name'), role: localStorage.getItem('role') });
    fetchAll();
  }, [navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/parcels`),
        axios.get(`${BACKEND_URL}/api/stats`),
      ]);
      setParcels(p.data); setStats(s.data);
      if (localStorage.getItem('role') === 'admin') {
        axios.get(`${BACKEND_URL}/api/users`).then(r => setUsers(r.data)).catch(() => {});
        axios.get(`${BACKEND_URL}/api/audit`).then(r => setAudit(r.data)).catch(() => {});
      }
    } catch (e) {
      if (e.response && (e.response.status === 401 || e.response.status === 403)) { localStorage.clear(); navigate('/login'); }
      else toast.error('Erreur de chargement');
    } finally { setLoading(false); }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  // --- Parcel actions ---
  const openDetail = (p) => { setDetail(p); setStatusDraft(p.status); setRecWeight(p.weight_kg || ''); setRecPrice(p.final_price || ''); };

  const updateStatus = async () => {
    try {
      await axios.patch(`${BACKEND_URL}/api/parcels/${detail.tracking_id}/status?status=${statusDraft}`);
      toast.success('Statut mis à jour');
      setDetail(null); fetchAll();
    } catch { toast.error('Erreur mise à jour'); }
  };

  const saveReception = async () => {
    try {
      await axios.patch(`${BACKEND_URL}/api/parcels/${detail.tracking_id}`, {
        weight_kg: parseFloat(recWeight) || 0,
        final_price: parseFloat(recPrice) || 0,
        status: 'RECEIVED_AT_DEPOT',
      });
      toast.success('Réception enregistrée');
      setDetail(null); fetchAll();
    } catch { toast.error('Erreur réception'); }
  };

  const bulkStatus = async (status) => {
    try {
      await Promise.all(selected.map(id => axios.patch(`${BACKEND_URL}/api/parcels/${id}/status?status=${status}`)));
      toast.success('Mise à jour groupée effectuée');
      setSelected([]); fetchAll();
    } catch { toast.error('Erreur partielle'); }
  };

  const createParcel = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/parcels`, { ...newParcel, operator: user.name });
      toast.success('Colis enregistré'); setNewParcelOpen(false); setNewParcel(initParcel()); fetchAll();
    } catch { toast.error('Erreur enregistrement'); }
  };

  const createUser = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/users`, newUser);
      toast.success('Compte créé'); setNewUserOpen(false); setNewUser({ username: '', password: '', full_name: '', role: 'operator' });
      axios.get(`${BACKEND_URL}/api/users`).then(r => setUsers(r.data));
    } catch { toast.error('Erreur création'); }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    return parcels.filter(p => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.tracking_id} ${p.sender?.name} ${p.receiver?.name} ${p.sender?.phone} ${p.receiver?.phone} ${p.sender?.city} ${p.receiver?.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFilter !== 'ALL') {
        const d = new Date(p.created_at);
        const diff = (now - d) / 86400000;
        if (dateFilter === 'TODAY' && d.toDateString() !== now.toDateString()) return false;
        if (dateFilter === 'WEEK' && diff > 7) return false;
        if (dateFilter === 'MONTH' && diff > 31) return false;
      }
      return true;
    });
  }, [parcels, statusFilter, search, dateFilter]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('nav_dashboard') },
    { id: 'parcels', icon: Package, label: t('nav_parcels') },
    ...(user.role === 'admin' ? [{ id: 'users', icon: Users, label: t('nav_users') }, { id: 'audit', icon: ScrollText, label: t('nav_audit') }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white fixed h-screen">
        <div className="p-6 flex items-center gap-2.5 border-b border-white/10">
          <div className="bg-orange-600 p-2 rounded-lg"><Package className="h-5 w-5" /></div>
          <span className="font-heading font-bold text-lg">LOGILINK</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(n => (
            <button key={n.id} data-testid={`nav-${n.id}`} onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === n.id ? 'bg-orange-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
              <n.icon className="h-4.5 w-4.5 h-5 w-5" /> {n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center"><User className="h-4 w-4" /></div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-slate-400 uppercase">{user.role}</div>
            </div>
          </div>
          <button onClick={logout} data-testid="logout-btn" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-4 w-4" /> {t('btn_logout')}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 lg:ml-64">
        {/* Topbar */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="bg-slate-900 p-1.5 rounded-lg text-white"><Package className="h-4 w-4" /></div>
            <span className="font-heading font-bold">LOGILINK</span>
          </div>
          <h1 className="hidden lg:block text-lg font-heading font-bold text-slate-900">{navItems.find(n => n.id === view)?.label}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setNewParcelOpen(true)} data-testid="new-parcel-btn" className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-orange-700 transition-colors">
              <PlusCircle className="h-4 w-4" /> <span className="hidden sm:inline">{t('btn_new_parcel')}</span>
            </button>
            <button onClick={logout} className="lg:hidden p-2 text-red-500"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 bg-white border-b border-slate-100">
          {navItems.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${view === n.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </button>
          ))}
        </div>

        <main className="p-4 md:p-8">
          {loading && <div className="flex justify-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-orange-600" /></div>}

          {!loading && view === 'dashboard' && stats && <Dashboard stats={stats} t={t} />}
          {!loading && view === 'parcels' && (
            <ParcelsView
              parcels={filtered} t={t} search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              dateFilter={dateFilter} setDateFilter={setDateFilter}
              selected={selected} setSelected={setSelected} bulkStatus={bulkStatus}
              openDetail={openDetail} refresh={fetchAll}
            />
          )}
          {!loading && view === 'users' && <UsersView users={users} t={t} onNew={() => setNewUserOpen(true)} />}
          {!loading && view === 'audit' && <AuditView audit={audit} />}
        </main>
      </div>

      {/* DETAIL DRAWER */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-orange-600">{detail.tracking_id}</span>
                  <StatusBadge status={detail.status} />
                </DialogTitle>
                <DialogDescription>{detail.sender?.name} → {detail.receiver?.name}</DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 py-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('detail_info')}</h4>
                  <div className="space-y-1.5 text-sm">
                    <Info label={t('from')} value={`${detail.sender?.city} (${detail.sender?.phone})`} />
                    <Info label={t('to')} value={`${detail.receiver?.city} (${detail.receiver?.phone})`} />
                    <Info label={t('content')} value={detail.content_description} />
                    <Info label={t('nature')} value={detail.nature || '—'} />
                    <Info label={t('weight')} value={detail.weight_kg ? `${detail.weight_kg} kg` : '—'} />
                    <Info label={t('declared_value')} value={detail.declared_value ? eur(detail.declared_value) : '—'} />
                    <Info label={t('price')} value={detail.final_price ? eur(detail.final_price) : '—'} />
                    <Info label={t('fragile')} value={detail.fragile ? '✓' : '—'} />
                    <Info label={t('insured')} value={detail.insured ? '✓' : '—'} />
                  </div>
                  <div className="mt-5 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900">{t('detail_update_status')}</h4>
                    <Select value={statusDraft} onValueChange={setStatusDraft}>
                      <SelectTrigger data-testid="status-select"><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{t(`status_${s}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button onClick={updateStatus} data-testid="update-status-btn" className="w-full bg-slate-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors">{t('update_btn')}</button>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <input placeholder={t('weight')} type="number" value={recWeight} onChange={e => setRecWeight(e.target.value)} data-testid="rec-weight" className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
                      <input placeholder={t('price')} type="number" value={recPrice} onChange={e => setRecPrice(e.target.value)} data-testid="rec-price" className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
                    </div>
                    <button onClick={saveReception} data-testid="save-reception-btn" className="w-full bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-orange-700 transition-colors">{t('reception')}</button>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">{t('detail_timeline')}</h4>
                  <Timeline parcel={detail} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* NEW PARCEL */}
      <Dialog open={newParcelOpen} onOpenChange={setNewParcelOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('modal_new_parcel')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Direction</label>
                <Select value={newParcel.direction} onValueChange={v => setNewParcel({ ...newParcel, direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EU_TO_CM">{t('direction_eu_cm')}</SelectItem>
                    <SelectItem value="CM_TO_EU">{t('direction_cm_eu')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">{t('dep_date')}</label>
                <input type="date" value={newParcel.departure_date} onChange={e => setNewParcel({ ...newParcel, departure_date: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
              <PartyFields title={t('sender')} party={newParcel.sender} onChange={(f, v) => setNewParcel({ ...newParcel, sender: { ...newParcel.sender, [f]: v } })} prefix="np-sender" />
              <PartyFields title={t('receiver')} party={newParcel.receiver} onChange={(f, v) => setNewParcel({ ...newParcel, receiver: { ...newParcel.receiver, [f]: v } })} prefix="np-receiver" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500">{t('content_desc')}</label>
              <input value={newParcel.content_description} onChange={e => setNewParcel({ ...newParcel, content_description: e.target.value })} data-testid="np-content" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setNewParcelOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50">{t('cancel')}</button>
            <button onClick={createParcel} data-testid="np-save" className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800">{t('save')}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW USER */}
      <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('new_user')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label={t('col_user')} value={newUser.username} onChange={v => setNewUser({ ...newUser, username: v })} testid="nu-username" />
            <Field label={t('name')} value={newUser.full_name} onChange={v => setNewUser({ ...newUser, full_name: v })} testid="nu-fullname" />
            <Field label={t('login_pass')} type="password" value={newUser.password} onChange={v => setNewUser({ ...newUser, password: v })} testid="nu-password" />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500">{t('col_role')}</label>
              <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['admin', 'director', 'agency_manager', 'depot_chief', 'operator', 'accountant', 'customer_service', 'delivery', 'supervisor', 'viewer'].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={createUser} data-testid="nu-save" className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700">{t('new_user')}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Sub-components ----------

function Dashboard({ stats, t }) {
  const kpis = [
    { label: t('kpi_total'), value: stats.total, icon: Package, color: 'bg-slate-900 text-white' },
    { label: t('kpi_transit'), value: stats.transit, icon: Truck, tint: 'bg-orange-50 text-orange-600' },
    { label: t('kpi_arrived'), value: stats.arrived, icon: CheckCircle2, tint: 'bg-teal-50 text-teal-600' },
    { label: t('kpi_delivered'), value: stats.delivered, icon: CheckCircle2, tint: 'bg-green-50 text-green-600' },
    { label: t('kpi_incidents'), value: stats.incidents, icon: AlertTriangle, tint: 'bg-red-50 text-red-600' },
    { label: t('kpi_collected'), value: eur(stats.revenue_collected), icon: Wallet, tint: 'bg-green-50 text-green-600' },
    { label: t('kpi_pending'), value: eur(stats.revenue_pending), icon: Clock, tint: 'bg-amber-50 text-amber-600' },
    { label: t('kpi_weight'), value: `${stats.total_weight} kg`, icon: Weight, tint: 'bg-slate-100 text-slate-600' },
    { label: t('kpi_volume'), value: `${stats.total_volume} m³`, icon: Box, tint: 'bg-slate-100 text-slate-600' },
    { label: t('kpi_clients'), value: stats.clients, icon: UserRound, tint: 'bg-indigo-50 text-indigo-600' },
    { label: t('kpi_success'), value: `${stats.success_rate}%`, icon: TrendingUp, tint: 'bg-green-50 text-green-600' },
    { label: t('kpi_avg_delivery'), value: `${stats.avg_delivery_days} ${t('days')}`, icon: Clock, tint: 'bg-sky-50 text-sky-600' },
  ];
  const dirData = [
    { name: t('direction_eu_cm'), value: stats.direction_counts?.EU_TO_CM || 0 },
    { name: t('direction_cm_eu'), value: stats.direction_counts?.CM_TO_EU || 0 },
  ];
  const statusData = Object.entries(stats.status_counts || {}).filter(([, v]) => v > 0).map(([k, v]) => ({ name: t(`status_${k}`) || k, value: v }));
  const COLORS = ['#EA580C', '#0F172A'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-slate-900">{t('dash_overview')}</h2>
        <p className="text-slate-500 text-sm">{t('dash_subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} data-testid={`kpi-${i}`} className={`rounded-xl border border-slate-200 p-5 shadow-sm card-hover ${k.color || 'bg-white'}`}>
            <div className="flex items-start justify-between">
              <span className={`text-xs uppercase tracking-wide ${k.color ? 'text-slate-300' : 'text-slate-500'}`}>{k.label}</span>
              <div className={`p-1.5 rounded-lg ${k.color ? 'bg-white/10 text-white' : k.tint}`}><k.icon className="h-4 w-4" /></div>
            </div>
            <div className={`text-2xl md:text-3xl font-heading font-bold mt-2 ${k.color ? 'text-white' : 'text-slate-900'}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">{t('chart_activity_title')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.daily_activity}>
              <defs>
                <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EA580C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EA580C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#EA580C" strokeWidth={2} fill="url(#c)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">{t('chart_dir_title')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dirData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                {dirData.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs">
            {dirData.map((d, i) => (
              <span key={i} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} /> {d.name} ({d.value})</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">{t('chart_status_title')}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} interval={0} angle={-30} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
            <Bar dataKey="value" fill="#0F172A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ParcelsView({ parcels, t, search, setSearch, statusFilter, setStatusFilter, dateFilter, setDateFilter, selected, setSelected, bulkStatus, openDetail, refresh }) {
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const dateChips = [['ALL', t('filter_all')], ['TODAY', t('filter_today')], ['WEEK', t('filter_week')], ['MONTH', t('filter_month')]];
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input data-testid="parcels-search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_placeholder')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-600" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1.5">
            {dateChips.map(([v, l]) => (
              <button key={v} onClick={() => setDateFilter(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${dateFilter === v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{l}</button>
            ))}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9" data-testid="status-filter"><SelectValue placeholder={t('col_status')} /></SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="ALL">{t('filter_all')}</SelectItem>
              {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{t(`status_${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={refresh} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><RefreshCw className="h-4 w-4 text-slate-500" /></button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between animate-fade-in">
          <span className="text-sm font-medium text-orange-800">{selected.length} {t('bulk_selected')}</span>
          <div className="flex gap-2">
            <button onClick={() => bulkStatus('IN_TRANSIT')} className="text-xs font-medium bg-orange-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Truck className="h-3 w-3" /> {t('bulk_ship')}</button>
            <button onClick={() => bulkStatus('ARRIVED')} className="text-xs font-medium bg-teal-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> {t('bulk_arrive')}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4 font-medium">{t('col_number_client')}</th>
                <th className="py-3 px-4 font-medium hidden md:table-cell">{t('col_route')}</th>
                <th className="py-3 px-4 font-medium hidden lg:table-cell">{t('col_dates')}</th>
                <th className="py-3 px-4 font-medium">{t('col_status')}</th>
                <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">{t('col_price')}</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {parcels.map(p => (
                <tr key={p.tracking_id} data-testid={`parcel-row-${p.tracking_id}`} onClick={() => openDetail(p)}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(p.tracking_id)} onChange={() => toggle(p.tracking_id)} className="h-4 w-4 rounded border-slate-300 text-orange-600" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-semibold text-orange-600">{p.tracking_id}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[160px]">{p.sender?.name} → {p.receiver?.name}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-slate-600 text-xs">{p.sender?.city} → {p.receiver?.city}</td>
                  <td className="py-3 px-4 hidden lg:table-cell text-xs font-mono text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell font-medium text-slate-700">{p.final_price ? eur(p.final_price) : '—'}</td>
                  <td className="py-3 px-4 text-slate-300"><ChevronRight className="h-4 w-4" /></td>
                </tr>
              ))}
              {parcels.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400"><Package className="h-10 w-10 mx-auto mb-3 opacity-30" />{t('no_parcels')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersView({ users, t, onNew }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Shield className="h-4 w-4 text-orange-600" /> {t('users_title')}</h3>
          <p className="text-sm text-slate-500">{t('users_subtitle')}</p>
        </div>
        <button onClick={onNew} data-testid="new-user-btn" className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-slate-800"><Users className="h-4 w-4" /> {t('new_user')}</button>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr><th className="py-3 px-5 font-medium">{t('col_user')}</th><th className="py-3 px-5 font-medium">{t('col_role')}</th><th className="py-3 px-5 font-medium text-right">{t('col_user_status')}</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.username} className="border-b border-slate-100">
              <td className="py-3 px-5"><div className="font-medium text-slate-900">{u.username}</div><div className="text-xs text-slate-500">{u.full_name}</div></td>
              <td className="py-3 px-5"><span className="text-xs uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{u.role}</span></td>
              <td className="py-3 px-5 text-right"><span className={`text-xs px-2 py-0.5 rounded-full ${u.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.disabled ? t('user_disabled') : t('user_active')}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditView({ audit }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
      {audit.map((a, i) => (
        <div key={i} className="flex items-center gap-4 p-4 text-sm">
          <span className="text-xs font-mono text-slate-400 w-36 shrink-0">{new Date(a.timestamp).toLocaleString()}</span>
          <span className="font-medium text-slate-900">{a.username}</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{a.action}</span>
          <span className="text-slate-500 truncate">{a.target} {a.details}</span>
        </div>
      ))}
      {audit.length === 0 && <div className="p-16 text-center text-slate-400">—</div>}
    </div>
  );
}

const Info = ({ label, value }) => (
  <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">{label}</span><span className="font-medium text-slate-900 text-right truncate">{value}</span></div>
);
const Field = ({ label, value, onChange, type = 'text', testid }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold uppercase text-slate-500">{label}</label>
    <input type={type} value={value} data-testid={testid} onChange={e => onChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
  </div>
);
const PartyFields = ({ title, party, onChange, prefix }) => (
  <div className="space-y-2.5">
    <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><User className="h-4 w-4" /> {title}</label>
    <input placeholder="Nom" value={party.name} data-testid={`${prefix}-name`} onChange={e => onChange('name', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
    <input placeholder="Téléphone" value={party.phone} data-testid={`${prefix}-phone`} onChange={e => onChange('phone', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
    <input placeholder="Ville" value={party.city} data-testid={`${prefix}-city`} onChange={e => onChange('city', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-600" />
  </div>
);

function initParcel() {
  return {
    direction: 'EU_TO_CM',
    sender: { name: '', phone: '', city: '' },
    receiver: { name: '', phone: '', city: '' },
    content_description: '',
    departure_date: new Date().toISOString().split('T')[0],
  };
}
