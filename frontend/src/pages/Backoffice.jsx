import React, { useState, useEffect } from 'react';
import { Header } from '../components/ui/Header';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package, Truck, CheckCircle2, AlertCircle, MessageSquare, Mail, Phone, RefreshCw, FileDown, Scale, Euro, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Backoffice() {
  const [parcels, setParcels] = useState([]);
  const [stats, setStats] = useState({ total: 0, registered: 0, transit: 0, arrived: 0, delivered: 0 });
  const [schedule, setSchedule] = useState({ eu_to_cm: [], cm_to_eu: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSearch, setFilterSearch] = useState("");

  // Bulk Actions
  const [selectedParcels, setSelectedParcels] = useState([]);

  // Notification State
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [notifyType, setNotifyType] = useState("sms");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Reception State
  const [receptionOpen, setReceptionOpen] = useState(false);
  const [receptionData, setReceptionData] = useState({ weight: "", price: "", note: "" });

  const fetchData = async () => {
      setLoading(true);
      try {
          const [parcelsRes, statsRes, schedRes] = await Promise.all([
              axios.get(`${BACKEND_URL}/api/parcels`),
              axios.get(`${BACKEND_URL}/api/stats`),
              axios.get(`${BACKEND_URL}/api/schedule`)
          ]);
          setParcels(parcelsRes.data);
          setStats(statsRes.data);
          setSchedule(schedRes.data);
      } catch (e) {
          toast.error("Erreur de chargement des données");
          console.error(e);
      } finally {
          setLoading(false);
      }
  }

  useEffect(() => {
      fetchData();
  }, []);

  const handleSelectAll = (checked) => {
      if(checked) {
          setSelectedParcels(filteredParcels.map(p => p.tracking_id));
      } else {
          setSelectedParcels([]);
      }
  }

  const handleSelectOne = (id, checked) => {
      if(checked) setSelectedParcels(prev => [...prev, id]);
      else setSelectedParcels(prev => prev.filter(pid => pid !== id));
  }

  // --- ACTIONS ---

  const openReceptionDialog = (parcel) => {
      setSelectedParcel(parcel);
      setReceptionData({ weight: parcel.weight_kg || "", price: parcel.final_price || "", note: parcel.note || "" });
      setReceptionOpen(true);
  }

  const handleReceptionSubmit = async () => {
      if (!receptionData.weight || !receptionData.price) {
          toast.error("Poids et Prix sont obligatoires pour la réception.");
          return;
      }
      try {
          await axios.patch(`${BACKEND_URL}/api/parcels/${selectedParcel.tracking_id}`, {
              status: "RECEIVED_AT_DEPOT",
              weight_kg: parseFloat(receptionData.weight),
              final_price: parseFloat(receptionData.price),
              note: receptionData.note
          });
          toast.success("Colis REÇU et tarifé !");
          setReceptionOpen(false);
          fetchData();
      } catch (e) {
          toast.error("Erreur réception");
      }
  }

  const updateStatus = async (id, newStatus) => {
      // If moving to RECEIVED manually without modal, warn user? No, enforce modal for logic.
      if (newStatus === "RECEIVED_AT_DEPOT") {
          const p = parcels.find(x => x.tracking_id === id);
          openReceptionDialog(p);
          return;
      }

      try {
          await axios.patch(`${BACKEND_URL}/api/parcels/${id}/status?status=${newStatus}`);
          toast.success(`Statut mis à jour: ${newStatus}`);
          fetchData(); 
      } catch (e) {
          toast.error("Erreur lors de la mise à jour");
      }
  }

  const handleBulkStatus = async (status) => {
      if(!window.confirm(`Passer ${selectedParcels.length} colis en statut "${status}" ?`)) return;
      
      const promises = selectedParcels.map(id => axios.patch(`${BACKEND_URL}/api/parcels/${id}/status?status=${status}`));
      try {
          await Promise.all(promises);
          toast.success("Mise à jour de masse effectuée !");
          setSelectedParcels([]);
          fetchData();
      } catch(e) {
          toast.error("Erreur partielle lors de la mise à jour de masse");
      }
  }

  const exportCSV = () => {
      const headers = ["Date", "ID", "Expediteur", "Destinataire", "Statut", "Poids (kg)", "Prix"];
      const rows = filteredParcels.map(p => [
          p.created_at, 
          p.tracking_id, 
          p.sender.name, 
          p.receiver.name, 
          p.status,
          p.weight_kg || 0,
          p.final_price || 0
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");
          
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "logilink_export.csv");
      document.body.appendChild(link);
      link.click();
  }

  const handleNotifyOpen = (parcel) => {
      setSelectedParcel(parcel);
      let msg = `Bonjour ${parcel.receiver.name}, votre colis ${parcel.tracking_id} est `;
      if (parcel.status === 'ARRIVED') msg += "arrivé à destination et prêt à être retiré.";
      else if (parcel.status === 'IN_TRANSIT') msg += "actuellement en transit vers le Cameroun.";
      else msg += `maintenant au statut: ${parcel.status}.`;
      setNotifyMessage(msg);
      setNotifyOpen(true);
  }

  const handleSendNotification = async () => {
      if (!selectedParcel) return;
      setSending(true);
      try {
          await axios.post(`${BACKEND_URL}/api/notify/simulate`, {
              tracking_id: selectedParcel.tracking_id,
              type: notifyType,
              message: notifyMessage
          });
          toast.success(`Simulation: ${notifyType.toUpperCase()} envoyé !`);
          setNotifyOpen(false);
      } catch (e) {
          toast.error("Erreur lors de l'envoi");
      } finally {
          setSending(false);
      }
  }

  // Filter Logic
  const filteredParcels = parcels.filter(p => {
      const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
      const matchesSearch = p.tracking_id.toLowerCase().includes(filterSearch.toLowerCase()) || 
                            p.sender.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
                            p.receiver.name.toLowerCase().includes(filterSearch.toLowerCase());
      return matchesStatus && matchesSearch;
  });

  const chartData = [
      { name: 'Enregistré', count: stats.registered, color: '#94a3b8' },
      { name: 'En Transit', count: stats.transit, color: '#f97316' },
      { name: 'Arrivé', count: stats.arrived, color: '#10b981' },
      { name: 'Livré', count: stats.delivered, color: '#0f172a' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
        <Header />
        
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                 <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900">POSTE DE CONTRÔLE</h1>
                    <p className="text-slate-500 font-medium">Gestion opérationnelle terrain</p>
                 </div>
                 <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Actualiser
                 </Button>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full md:w-[600px] grid-cols-3 mb-8">
                    <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
                    <TabsTrigger value="parcels">Gestion & Reception</TabsTrigger>
                    <TabsTrigger value="schedule">Départs</TabsTrigger>
                </TabsList>

                {/* --- DASHBOARD --- */}
                <TabsContent value="dashboard" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Colis</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">En Transit</CardTitle>
                                <Truck className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{stats.transit}</div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">À Récupérer</CardTitle>
                                <AlertCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.arrived}</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- PARCELS MANAGEMENT --- */}
                <TabsContent value="parcels">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <CardTitle>Liste des Colis</CardTitle>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    <Input 
                                        placeholder="Recherche rapide..." 
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        className="w-[150px] md:w-[200px]"
                                    />
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue placeholder="Filtrer par statut" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Tous les statuts</SelectItem>
                                            <SelectItem value="REGISTERED">1. Enregistré</SelectItem>
                                            <SelectItem value="RECEIVED_AT_DEPOT">2. Reçu (Pesé)</SelectItem>
                                            <SelectItem value="IN_TRANSIT">3. En Transit</SelectItem>
                                            <SelectItem value="ARRIVED">4. Arrivé</SelectItem>
                                            <SelectItem value="DELIVERED">5. Livré</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" onClick={exportCSV} title="Exporter CSV">
                                        <FileDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Bulk Actions Bar */}
                            {selectedParcels.length > 0 && (
                                <div className="bg-slate-100 p-2 mt-4 flex items-center gap-4 rounded border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                    <span className="font-bold text-sm text-slate-700">{selectedParcels.length} sélectionné(s)</span>
                                    <div className="h-4 w-px bg-slate-300" />
                                    <Button size="sm" onClick={() => handleBulkStatus("IN_TRANSIT")} className="bg-orange-600 hover:bg-orange-700">
                                        <Truck className="h-3 w-3 mr-2" /> Marquer "En Expédition"
                                    </Button>
                                    <Button size="sm" onClick={() => handleBulkStatus("ARRIVED")} className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="h-3 w-3 mr-2" /> Marquer "Arrivé"
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
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
                                        <TableHead>ID & Info</TableHead>
                                        <TableHead>Expéditeur</TableHead>
                                        <TableHead>Destinataire</TableHead>
                                        <TableHead>Poids/Prix</TableHead>
                                        <TableHead>Statut</TableHead>
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
                                                <div className="font-mono font-bold text-accent">{p.tracking_id}</div>
                                                <div className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString()}</div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {p.sender.name}
                                                <div className="flex items-center gap-1 mt-1">
                                                     <a href={`https://wa.me/${p.sender.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 hover:bg-green-100 p-1 rounded">
                                                        <Phone className="h-3 w-3" />
                                                     </a>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {p.receiver.name}
                                                <div className="flex items-center gap-1 mt-1">
                                                     <a href={`https://wa.me/${p.receiver.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 hover:bg-green-100 p-1 rounded">
                                                        <Phone className="h-3 w-3" />
                                                     </a>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {p.weight_kg ? (
                                                    <div className="text-xs font-mono">
                                                        <div>{p.weight_kg} kg</div>
                                                        <div className="font-bold">{p.final_price} €</div>
                                                    </div>
                                                ) : <span className="text-xs text-slate-400">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    p.status === 'DELIVERED' ? 'bg-slate-800' : 
                                                    p.status === 'IN_TRANSIT' ? 'bg-orange-600' : 
                                                    p.status === 'ARRIVED' ? 'bg-green-600' : 
                                                    p.status === 'RECEIVED_AT_DEPOT' ? 'bg-blue-600' : 
                                                    'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }>
                                                    {p.status === 'RECEIVED_AT_DEPOT' ? 'REÇU DÉPÔT' : p.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="flex gap-2">
                                                <Select 
                                                    defaultValue={p.status} 
                                                    onValueChange={(val) => updateStatus(p.tracking_id, val)}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="REGISTERED">ENREGISTRÉ</SelectItem>
                                                        <SelectItem value="RECEIVED_AT_DEPOT" className="font-bold text-blue-600">REÇU (PESER)</SelectItem>
                                                        <SelectItem value="IN_TRANSIT">EN TRANSIT</SelectItem>
                                                        <SelectItem value="ARRIVED">ARRIVÉ</SelectItem>
                                                        <SelectItem value="DELIVERED">LIVRÉ</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleNotifyOpen(p)}>
                                                    <MessageSquare className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                 {/* --- SCHEDULE TAB (Placeholder for now) --- */}
                 <TabsContent value="schedule">
                    <Card>
                        <CardHeader><CardTitle>Prochains Départs</CardTitle></CardHeader>
                        <CardContent><p className="text-slate-500">Voir section Accueil pour l'instant.</p></CardContent>
                    </Card>
                 </TabsContent>
            </Tabs>
        </div>

        {/* RECEPTION DIALOG */}
        <Dialog open={receptionOpen} onOpenChange={setReceptionOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5"/> Réception Colis: {selectedParcel?.tracking_id}</DialogTitle>
                    <DialogDescription>
                        Étape obligatoire : Saisir le poids et le prix final pour valider la réception.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-bold">Poids (kg)</Label>
                        <Input 
                            className="col-span-3" type="number" step="0.1" 
                            value={receptionData.weight}
                            onChange={(e) => setReceptionData({...receptionData, weight: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-bold">Prix Final</Label>
                        <Input 
                            className="col-span-3" type="number" 
                            value={receptionData.price}
                            onChange={(e) => setReceptionData({...receptionData, price: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Note</Label>
                        <Textarea 
                            className="col-span-3" placeholder="Ex: Fragile, Emballage renforcé..."
                            value={receptionData.note}
                            onChange={(e) => setReceptionData({...receptionData, note: e.target.value})}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setReceptionOpen(false)}>Annuler</Button>
                    <Button onClick={handleReceptionSubmit} className="bg-blue-600 hover:bg-blue-700">Valider Réception</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* NOTIFICATION DIALOG */}
        <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Notifier le Client</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Message</Label>
                        <Textarea 
                            className="col-span-3 h-32" 
                            value={notifyMessage}
                            onChange={(e) => setNotifyMessage(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSendNotification} disabled={sending}>
                        {sending ? "Envoi..." : "Envoyer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
