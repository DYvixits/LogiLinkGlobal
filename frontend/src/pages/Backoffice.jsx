import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Package, Truck, CheckCircle2, AlertCircle, MessageSquare, RefreshCw, FileDown, Receipt, User, LogOut, PlusCircle, Users, Shield, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Backoffice() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [user, setUser] = useState({ name: '', role: '' });

  // Filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedParcels, setSelectedParcels] = useState([]);

  // Modals
  const [receptionOpen, setReceptionOpen] = useState(false);
  const [receptionData, setReceptionData] = useState({ weight: "", price: "", note: "" });
  const [selectedParcel, setSelectedParcel] = useState(null);
  
  const [newParcelOpen, setNewParcelOpen] = useState(false);
  const [newParcelData, setNewParcelData] = useState({
      direction: "EU_TO_CM",
      sender: { name: "", phone: "", city: "" },
      receiver: { name: "", phone: "", city: "" },
      content_description: "",
      departure_date: new Date().toISOString().split('T')[0]
  });

  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
      username: "",
      password: "",
      full_name: "",
      role: "operator"
  });

  useEffect(() => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const name = localStorage.getItem('user_name');
      
      if (!token) {
          navigate('/login');
          return;
      }
      setUser({ name, role });
      fetchData();
      if (role === 'admin') fetchUsers();
  }, [navigate]);

  const fetchData = async () => {
      setLoading(true);
      try {
          const [parcelsRes, statsRes] = await Promise.all([
              axios.get(`${BACKEND_URL}/api/parcels`),
              axios.get(`${BACKEND_URL}/api/stats`)
          ]);
          setParcels(parcelsRes.data);
          setStats(statsRes.data);
      } catch (e) {
          if(e.response && e.response.status === 401) navigate('/login');
          toast.error("Erreur de chargement");
      } finally {
          setLoading(false);
      }
  };

  const fetchUsers = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${BACKEND_URL}/api/users`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setUsers(res.data);
      } catch (e) {
          console.error("Failed to fetch users");
      }
  };

  const handleLogout = () => {
      localStorage.clear();
      navigate('/login');
  };

  // --- ACTIONS ---
  
  const handleCreateParcel = async () => {
      try {
          await axios.post(`${BACKEND_URL}/api/parcels`, newParcelData);
          toast.success("Colis enregistré avec succès !");
          setNewParcelOpen(false);
          fetchData();
          setNewParcelData({
             direction: "EU_TO_CM",
             sender: { name: "", phone: "", city: "" },
             receiver: { name: "", phone: "", city: "" },
             content_description: "",
             departure_date: new Date().toISOString().split('T')[0]
          });
      } catch (e) {
          toast.error("Erreur enregistrement");
      }
  };

  const handleCreateUser = async () => {
      try {
          const token = localStorage.getItem('token');
          await axios.post(`${BACKEND_URL}/api/users`, newUserData, {
              headers: { Authorization: `Bearer ${token}` }
          });
          toast.success("Compte créé avec succès !");
          setNewUserOpen(false);
          fetchUsers();
          setNewUserData({ username: "", password: "", full_name: "", role: "operator" });
      } catch (e) {
          toast.error("Erreur création utilisateur");
      }
  };

  const openReceptionDialog = (parcel) => {
      setSelectedParcel(parcel);
      setReceptionData({ weight: parcel.weight_kg || "", price: parcel.final_price || "", note: parcel.note || "" });
      setReceptionOpen(true);
  };

  const handleReceptionSubmit = async () => {
      if (!receptionData.weight || !receptionData.price) {
          toast.error("Poids et Prix sont obligatoires.");
          return;
      }
      try {
          await axios.patch(`${BACKEND_URL}/api/parcels/${selectedParcel.tracking_id}`, {
              status: "RECEIVED_AT_DEPOT",
              weight_kg: parseFloat(receptionData.weight),
              final_price: parseFloat(receptionData.price),
              note: receptionData.note
          });
          toast.success("Réception validée !");
          setReceptionOpen(false);
          fetchData();
      } catch (e) {
          toast.error("Erreur réception");
      }
  };
  
  const handleBulkStatus = async (status) => {
      if(!window.confirm(`Passer ${selectedParcels.length} colis en statut "${status}" ?`)) return;
      const promises = selectedParcels.map(id => axios.patch(`${BACKEND_URL}/api/parcels/${id}/status?status=${status}`));
      try {
          await Promise.all(promises);
          toast.success("Mise à jour de masse effectuée !");
          setSelectedParcels([]);
          fetchData();
      } catch(e) {
          toast.error("Erreur partielle");
      }
  };

  const filteredParcels = parcels.filter(p => {
      const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
      const matchesSearch = p.tracking_id.toLowerCase().includes(filterSearch.toLowerCase()) || 
                            p.sender.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
                            p.receiver.name.toLowerCase().includes(filterSearch.toLowerCase());
      return matchesStatus && matchesSearch;
  });

  const handleSelectOne = (id, checked) => {
      if(checked) setSelectedParcels(prev => [...prev, id]);
      else setSelectedParcels(prev => prev.filter(pid => pid !== id));
  };
  
  const handleSelectAll = (checked) => {
      if(checked) setSelectedParcels(filteredParcels.map(p => p.tracking_id));
      else setSelectedParcels([]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
        <Header />
        
        {/* Top User Bar - Responsive */}
        <div className="bg-white border-b border-slate-200 p-4 sticky top-[80px] z-40 shadow-sm">
             <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4 w-full md:w-auto">
                     <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="h-6 w-6 text-slate-700" />
                     </div>
                     <div>
                        <h2 className="font-bold text-slate-900 truncate">{user.name}</h2>
                        <Badge variant="outline" className="uppercase text-xs">{user.role}</Badge>
                     </div>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                     <Button onClick={() => setNewParcelOpen(true)} className="flex-1 md:flex-none bg-accent hover:bg-orange-700 gap-2">
                        <PlusCircle className="h-4 w-4" /> <span className="hidden sm:inline">{t('btn_new_parcel')}</span>
                     </Button>
                     <Button variant="ghost" onClick={handleLogout} className="flex-1 md:flex-none text-red-500 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">{t('btn_logout')}</span>
                     </Button>
                 </div>
             </div>
        </div>
        
        <div className="container py-6">
            <Tabs defaultValue="parcels" className="w-full">
                <TabsList className="mb-6 w-full flex justify-start overflow-x-auto">
                    <TabsTrigger value="parcels" className="flex-1 md:flex-none">{t('manage_parcels')}</TabsTrigger>
                    {user.role === 'admin' && <TabsTrigger value="users" className="flex-1 md:flex-none">{t('admin_users')}</TabsTrigger>}
                </TabsList>

                <TabsContent value="parcels">
                     {/* Stats Cards - Responsive Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        <Card className="bg-slate-900 text-white border-none col-span-2 md:col-span-1">
                            <CardContent className="p-3 md:p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-2xl md:text-3xl font-bold">{stats.total || 0}</div>
                                <div className="text-xs uppercase opacity-70">{t('total_parcels')}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardContent className="p-3 md:p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-2xl md:text-3xl font-bold text-slate-600">{stats.registered || 0}</div>
                                <div className="text-[10px] md:text-xs uppercase text-slate-500">{t('waiting')}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardContent className="p-3 md:p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-2xl md:text-3xl font-bold text-orange-600">{stats.transit || 0}</div>
                                <div className="text-[10px] md:text-xs uppercase text-slate-500">{t('in_transit')}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardContent className="p-3 md:p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.arrived || 0}</div>
                                <div className="text-[10px] md:text-xs uppercase text-slate-500">{t('arrived')}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-100 col-span-2 md:col-span-1">
                            <CardContent className="p-3 md:p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-2xl md:text-3xl font-bold text-red-600">0</div>
                                <div className="text-[10px] md:text-xs uppercase text-red-500">{t('delayed')}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                        {/* Filters & Search - Stacked on Mobile */}
                        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                            <div className="flex gap-2 overflow-x-auto w-full pb-2 lg:pb-0 no-scrollbar">
                                {["ALL", "REGISTERED", "RECEIVED_AT_DEPOT", "IN_TRANSIT", "ARRIVED"].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 text-xs md:text-sm font-bold uppercase rounded-full whitespace-nowrap transition-colors border ${
                                            filterStatus === status 
                                            ? "bg-slate-900 text-white border-slate-900" 
                                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        {status === "ALL" ? t('filter_all') : status.replace(/_/g, " ")}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex gap-2 w-full lg:w-auto">
                                <div className="relative flex-1">
                                    <Input 
                                        placeholder={t('filter_search')}
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        className="w-full lg:w-[250px]"
                                    />
                                </div>
                                <Button variant="outline" size="icon" onClick={fetchData}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedParcels.length > 0 && (
                            <div className="bg-blue-50 p-3 border-b border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2">
                                <span className="text-sm font-bold text-blue-800">{selectedParcels.length} {t('bulk_selected')}</span>
                                <div className="flex gap-2 w-full sm:w-auto">
                                     <Button size="sm" onClick={() => handleBulkStatus("IN_TRANSIT")} className="flex-1 bg-orange-600 hover:bg-orange-700">
                                        <Truck className="h-3 w-3 mr-2" /> {t('bulk_ship')}
                                     </Button>
                                     <Button size="sm" onClick={() => handleBulkStatus("ARRIVED")} className="flex-1 bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="h-3 w-3 mr-2" /> {t('bulk_arrive')}
                                     </Button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px]">
                                            <input 
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                checked={selectedParcels.length === filteredParcels.length && filteredParcels.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </TableHead>
                                        <TableHead>{t('col_number_client')}</TableHead>
                                        <TableHead className="hidden md:table-cell">{t('col_dates')}</TableHead>
                                        <TableHead>{t('col_status')}</TableHead>
                                        <TableHead className="text-right">{t('col_actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredParcels.map((p) => (
                                        <TableRow key={p.tracking_id} className={selectedParcels.includes(p.tracking_id) ? "bg-slate-50" : ""}>
                                            <TableCell>
                                                <input 
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                    checked={selectedParcels.includes(p.tracking_id)}
                                                    onChange={(e) => handleSelectOne(p.tracking_id, e.target.checked)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-bold text-base text-accent">{p.tracking_id}</span>
                                                    <span className="text-xs text-slate-600 font-medium truncate max-w-[150px]">{p.sender.name} &rarr; {p.receiver.name}</span>
                                                    {/* Mobile Only Date */}
                                                    <span className="md:hidden text-[10px] text-slate-400 mt-1">{new Date(p.estimated_arrival).toLocaleDateString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex flex-col text-sm">
                                                    <span className="text-slate-500">{t('label_depot')}: {new Date(p.created_at).toLocaleDateString()}</span>
                                                    <span className="font-bold text-slate-700">{t('label_arrival')}: {new Date(p.estimated_arrival).toLocaleDateString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    p.status === 'ARRIVED' ? 'bg-green-500' : 
                                                    p.status === 'IN_TRANSIT' ? 'bg-orange-500' : 
                                                    p.status === 'RECEIVED_AT_DEPOT' ? 'bg-blue-500' : 
                                                    'bg-slate-500'
                                                }>
                                                    {p.status === 'RECEIVED_AT_DEPOT' ? 'REÇU' : p.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => openReceptionDialog(p)}
                                                    disabled={p.status !== 'REGISTERED'}
                                                    className="h-8 text-xs"
                                                >
                                                    <Receipt className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">{t('btn_receipt')}</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredParcels.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                                                <Package className="h-12 w-12 mx-auto mb-3 opacity-20"/>
                                                <p>Aucun colis trouvé</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                {user.role === 'admin' && (
                    <TabsContent value="users">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Utilisateurs</CardTitle>
                                    <p className="text-sm text-slate-500">Gérez les accès opérateurs.</p>
                                </div>
                                <Button onClick={() => setNewUserOpen(true)} className="gap-2"><Users className="h-4 w-4"/> <span className="hidden sm:inline">Nouveau</span></Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Utilisateur</TableHead>
                                            <TableHead>Rôle</TableHead>
                                            <TableHead className="text-right">Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map(u => (
                                            <TableRow key={u.username}>
                                                <TableCell>
                                                    <div className="font-bold">{u.username}</div>
                                                    <div className="text-xs text-slate-500">{u.full_name}</div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline" className="uppercase text-[10px]">{u.role}</Badge></TableCell>
                                                <TableCell className="text-right"><Badge className="bg-green-500 text-[10px]">Actif</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>

        {/* --- MODAL NOUVEAU COLIS (FULLSCREEN MOBILE) --- */}
        <Dialog open={newParcelOpen} onOpenChange={setNewParcelOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('modal_new_parcel')}</DialogTitle>
                    <DialogDescription>Saisie rapide pour l'opérateur.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label>Direction</Label>
                             <Select value={newParcelData.direction} onValueChange={(v) => setNewParcelData({...newParcelData, direction: v})}>
                                <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EU_TO_CM">Europe -> Cameroun</SelectItem>
                                    <SelectItem value="CM_TO_EU">Cameroun -> Europe</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Date Dépôt</Label>
                             <Input type="date" value={newParcelData.departure_date} onChange={e => setNewParcelData({...newParcelData, departure_date: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
                        <div className="space-y-3">
                            <Label className="font-bold flex items-center gap-2"><User className="h-4 w-4"/> Expéditeur</Label>
                            <Input placeholder="Nom complet" value={newParcelData.sender.name} onChange={e => setNewParcelData({...newParcelData, sender: {...newParcelData.sender, name: e.target.value}})} />
                            <Input placeholder="Téléphone" value={newParcelData.sender.phone} onChange={e => setNewParcelData({...newParcelData, sender: {...newParcelData.sender, phone: e.target.value}})} />
                            <Input placeholder="Ville" value={newParcelData.sender.city} onChange={e => setNewParcelData({...newParcelData, sender: {...newParcelData.sender, city: e.target.value}})} />
                        </div>
                        <div className="space-y-3">
                            <Label className="font-bold flex items-center gap-2"><User className="h-4 w-4"/> Destinataire</Label>
                            <Input placeholder="Nom complet" value={newParcelData.receiver.name} onChange={e => setNewParcelData({...newParcelData, receiver: {...newParcelData.receiver, name: e.target.value}})} />
                            <Input placeholder="Téléphone" value={newParcelData.receiver.phone} onChange={e => setNewParcelData({...newParcelData, receiver: {...newParcelData.receiver, phone: e.target.value}})} />
                            <Input placeholder="Ville" value={newParcelData.receiver.city} onChange={e => setNewParcelData({...newParcelData, receiver: {...newParcelData.receiver, city: e.target.value}})} />
                        </div>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                        <Label>Contenu</Label>
                        <Input placeholder="Description..." value={newParcelData.content_description} onChange={e => setNewParcelData({...newParcelData, content_description: e.target.value})} />
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setNewParcelOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={handleCreateParcel} className="bg-slate-900">{t('save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* --- MODAL NOUVEAU COMPTE (ADMIN) --- */}
        <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Créer un Compte Opérateur</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                         <Label>Nom d'utilisateur</Label>
                         <Input value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                         <Label>Nom Complet</Label>
                         <Input value={newUserData.full_name} onChange={e => setNewUserData({...newUserData, full_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                         <Label>Mot de Passe</Label>
                         <Input type="password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                         <Label>Rôle</Label>
                         <Select value={newUserData.role} onValueChange={(v) => setNewUserData({...newUserData, role: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operator">Opérateur</SelectItem>
                                <SelectItem value="supervisor">Superviseur</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreateUser} className="w-full">Créer le compte</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* --- MODAL RECEPTION --- */}
        <Dialog open={receptionOpen} onOpenChange={setReceptionOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('modal_reception')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-bold">{t('weight')}</Label>
                        <Input type="number" step="0.1" value={receptionData.weight} onChange={(e) => setReceptionData({...receptionData, weight: e.target.value})} className="col-span-3 font-mono text-lg" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-bold">{t('price')}</Label>
                        <Input type="number" value={receptionData.price} onChange={(e) => setReceptionData({...receptionData, price: e.target.value})} className="col-span-3 font-mono text-lg" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleReceptionSubmit} className="w-full bg-blue-600 hover:bg-blue-700">{t('validate')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
