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
import { Package, Truck, CheckCircle2, AlertCircle, MessageSquare, RefreshCw, FileDown, Receipt, User, LogOut, PlusCircle, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Backoffice() {
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
        
        <div className="bg-white border-b border-slate-200 py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-700" />
                 </div>
                 <div>
                    <h2 className="font-bold text-slate-900">{user.name}</h2>
                    <Badge variant="outline" className="uppercase text-xs">{user.role === 'admin' ? 'Administrateur' : user.role === 'supervisor' ? 'Superviseur' : 'Opérateur'}</Badge>
                 </div>
             </div>
             <div className="flex gap-2">
                 <Button onClick={() => setNewParcelOpen(true)} className="bg-accent hover:bg-orange-700 gap-2">
                    <PlusCircle className="h-4 w-4" /> Enregistrer Colis
                 </Button>
                 <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                 </Button>
             </div>
        </div>
        
        <div className="container py-8">
            <Tabs defaultValue="parcels" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="parcels">Gestion des Colis</TabsTrigger>
                    {user.role === 'admin' && <TabsTrigger value="users">Administration Utilisateurs</TabsTrigger>}
                </TabsList>

                <TabsContent value="parcels">
                     {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <Card className="bg-slate-900 text-white border-none">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-3xl font-bold">{stats.total || 0}</div>
                                <div className="text-xs uppercase opacity-70">Total Colis</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-3xl font-bold text-slate-600">{stats.registered || 0}</div>
                                <div className="text-xs uppercase text-slate-500">En Attente</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-3xl font-bold text-orange-600">{stats.transit || 0}</div>
                                <div className="text-xs uppercase text-slate-500">En Transit</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-3xl font-bold text-green-600">{stats.arrived || 0}</div>
                                <div className="text-xs uppercase text-slate-500">Arrivés</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-100">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-3xl font-bold text-red-600">0</div>
                                <div className="text-xs uppercase text-red-500">En Retard</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                                {["ALL", "REGISTERED", "RECEIVED_AT_DEPOT", "IN_TRANSIT", "ARRIVED"].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 text-sm font-bold uppercase rounded-full whitespace-nowrap transition-colors ${
                                            filterStatus === status 
                                            ? "bg-slate-900 text-white" 
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                    >
                                        {status === "ALL" ? "Tous" : status.replace(/_/g, " ")}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto">
                                <Input 
                                    placeholder="Rechercher..." 
                                    value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    className="max-w-[200px]"
                                />
                                <Button variant="outline" size="icon" onClick={fetchData}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedParcels.length > 0 && (
                            <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-center justify-between">
                                <span className="text-sm font-bold text-blue-800">{selectedParcels.length} colis sélectionnés</span>
                                <div className="flex gap-2">
                                     <Button size="sm" onClick={() => handleBulkStatus("IN_TRANSIT")} className="bg-orange-600 hover:bg-orange-700">
                                        <Truck className="h-3 w-3 mr-2" /> Mettre en Expédition
                                     </Button>
                                     <Button size="sm" onClick={() => handleBulkStatus("ARRIVED")} className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="h-3 w-3 mr-2" /> Marquer Arrivé
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
                                        <TableHead>Numéro Colis</TableHead>
                                        <TableHead>État</TableHead>
                                        <TableHead>Date Dépôt</TableHead>
                                        <TableHead>Date Prévue Arrivée</TableHead>
                                        <TableHead>Actions</TableHead>
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
                                                <div className="font-mono font-bold text-lg">{p.tracking_id}</div>
                                                <div className="text-xs text-slate-500">{p.sender.name} &rarr; {p.receiver.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    p.status === 'ARRIVED' ? 'bg-green-500' : 
                                                    p.status === 'IN_TRANSIT' ? 'bg-orange-500' : 
                                                    p.status === 'RECEIVED_AT_DEPOT' ? 'bg-blue-500' : 
                                                    'bg-slate-500'
                                                }>
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm font-bold text-slate-700">
                                                {new Date(p.estimated_arrival).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="mr-2"
                                                    onClick={() => openReceptionDialog(p)}
                                                    disabled={p.status !== 'REGISTERED'}
                                                >
                                                    <Receipt className="h-4 w-4 mr-1" /> Réceptionner
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredParcels.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-400">Aucun colis trouvé</TableCell>
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
                                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Gestion des Utilisateurs</CardTitle>
                                <Button onClick={() => setNewUserOpen(true)} className="gap-2"><Users className="h-4 w-4"/> Nouveau Compte</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nom d'utilisateur</TableHead>
                                            <TableHead>Nom Complet</TableHead>
                                            <TableHead>Rôle</TableHead>
                                            <TableHead>Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map(u => (
                                            <TableRow key={u.username}>
                                                <TableCell className="font-bold">{u.username}</TableCell>
                                                <TableCell>{u.full_name}</TableCell>
                                                <TableCell><Badge variant="outline" className="uppercase">{u.role}</Badge></TableCell>
                                                <TableCell><Badge className="bg-green-500">Actif</Badge></TableCell>
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

        {/* --- MODAL NOUVEAU COLIS --- */}
        <Dialog open={newParcelOpen} onOpenChange={setNewParcelOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Enregistrer un nouveau colis</DialogTitle>
                    <DialogDescription>Saisie rapide pour l'opérateur.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label>Direction</Label>
                             <Select value={newParcelData.direction} onValueChange={(v) => setNewParcelData({...newParcelData, direction: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                    
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label className="font-bold">Expéditeur</Label>
                            <Input placeholder="Nom" value={newParcelData.sender.name} onChange={e => setNewParcelData({...newParcelData, sender: {...newParcelData.sender, name: e.target.value}})} />
                            <Input placeholder="Tel" value={newParcelData.sender.phone} onChange={e => setNewParcelData({...newParcelData, sender: {...newParcelData.sender, phone: e.target.value}})} />
                            <Input placeholder="Ville" value={newParcelData.sender.city} onChange={e => setNewParcelData({...newParcelData, sender: {...newParcelData.sender, city: e.target.value}})} />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Destinataire</Label>
                            <Input placeholder="Nom" value={newParcelData.receiver.name} onChange={e => setNewParcelData({...newParcelData, receiver: {...newParcelData.receiver, name: e.target.value}})} />
                            <Input placeholder="Tel" value={newParcelData.receiver.phone} onChange={e => setNewParcelData({...newParcelData, receiver: {...newParcelData.receiver, phone: e.target.value}})} />
                            <Input placeholder="Ville" value={newParcelData.receiver.city} onChange={e => setNewParcelData({...newParcelData, receiver: {...newParcelData.receiver, city: e.target.value}})} />
                        </div>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                        <Label>Contenu</Label>
                        <Input placeholder="Description..." value={newParcelData.content_description} onChange={e => setNewParcelData({...newParcelData, content_description: e.target.value})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setNewParcelOpen(false)}>Annuler</Button>
                    <Button onClick={handleCreateParcel}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* --- MODAL NOUVEAU COMPTE (ADMIN) --- */}
        <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
            <DialogContent>
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
                    <Button onClick={handleCreateUser}>Créer le compte</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* --- MODAL RECEPTION --- */}
        <Dialog open={receptionOpen} onOpenChange={setReceptionOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Réception Colis</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Poids (kg)</Label>
                        <Input type="number" value={receptionData.weight} onChange={(e) => setReceptionData({...receptionData, weight: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Prix Final</Label>
                        <Input type="number" value={receptionData.price} onChange={(e) => setReceptionData({...receptionData, price: e.target.value})} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleReceptionSubmit}>Valider Réception</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
