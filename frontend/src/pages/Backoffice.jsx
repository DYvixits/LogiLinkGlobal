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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package, Truck, CheckCircle2, AlertCircle, Calendar, MessageSquare, Mail, Phone, RefreshCw } from 'lucide-react';
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

  // Notification State
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [notifyType, setNotifyType] = useState("sms");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [sending, setSending] = useState(false);

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

  const updateStatus = async (id, newStatus) => {
      try {
          await axios.patch(`${BACKEND_URL}/api/parcels/${id}/status?status=${newStatus}`);
          toast.success(`Statut mis à jour: ${newStatus}`);
          fetchData(); 
      } catch (e) {
          toast.error("Erreur lors de la mise à jour");
      }
  }

  const handleNotifyOpen = (parcel) => {
      setSelectedParcel(parcel);
      // Pre-fill message based on status
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
          toast.success(`Simulation: ${notifyType.toUpperCase()} envoyé avec succès !`);
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

  // Chart Data
  const chartData = [
      { name: 'Enregistré', count: stats.registered, color: '#94a3b8' },
      { name: 'En Transit', count: stats.transit, color: '#f97316' }, // Orange
      { name: 'Arrivé', count: stats.arrived, color: '#10b981' }, // Green
      { name: 'Livré', count: stats.delivered, color: '#0f172a' }, // Dark
  ];

  return (
    <div className="min-h-screen bg-slate-50">
        <Header />
        
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                 <h1 className="text-3xl font-heading font-bold text-slate-900">TABLEAU DE BORD OPÉRATEUR</h1>
                 <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Actualiser
                 </Button>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full md:w-[600px] grid-cols-3 mb-8">
                    <TabsTrigger value="dashboard">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="parcels">Gestion des Colis</TabsTrigger>
                    <TabsTrigger value="schedule">Calendrier</TabsTrigger>
                </TabsList>

                {/* --- DASHBOARD TAB --- */}
                <TabsContent value="dashboard" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Colis</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-muted-foreground">Depuis le début</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">En Transit</CardTitle>
                                <Truck className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{stats.transit}</div>
                                <p className="text-xs text-muted-foreground">En cours d'acheminement</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">À Récupérer</CardTitle>
                                <AlertCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.arrived}</div>
                                <p className="text-xs text-muted-foreground">Arrivés au dépôt</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Livrés</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-slate-900" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{stats.delivered}</div>
                                <p className="text-xs text-muted-foreground">Traitement terminé</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Répartition des Colis</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <Tooltip />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PARCELS TAB --- */}
                <TabsContent value="parcels">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Liste des Colis</CardTitle>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Rechercher (ID, Nom)..." 
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        className="w-[200px]"
                                    />
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filtrer par statut" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Tous les statuts</SelectItem>
                                            <SelectItem value="REGISTERED">Enregistré</SelectItem>
                                            <SelectItem value="RECEIVED_AT_DEPOT">Reçu au Dépôt</SelectItem>
                                            <SelectItem value="IN_TRANSIT">En Transit</SelectItem>
                                            <SelectItem value="ARRIVED">Arrivé</SelectItem>
                                            <SelectItem value="DELIVERED">Livré</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>ID Suivi</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredParcels.map((p) => (
                                        <TableRow key={p.tracking_id}>
                                            <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-mono font-bold">{p.tracking_id}</TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{p.sender.name}</div>
                                                <div className="text-xs text-muted-foreground">&rarr; {p.receiver.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    p.status === 'DELIVERED' ? 'default' : 
                                                    p.status === 'IN_TRANSIT' ? 'destructive' : // Orange really
                                                    'secondary'
                                                } className={
                                                    p.status === 'IN_TRANSIT' ? 'bg-orange-500 hover:bg-orange-600' : 
                                                    p.status === 'ARRIVED' ? 'bg-green-500 hover:bg-green-600 text-white' : ''
                                                }>
                                                    {p.status}
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
                                                        <SelectItem value="RECEIVED_AT_DEPOT">AU DÉPÔT</SelectItem>
                                                        <SelectItem value="IN_TRANSIT">EN TRANSIT</SelectItem>
                                                        <SelectItem value="ARRIVED">ARRIVÉ</SelectItem>
                                                        <SelectItem value="DELIVERED">LIVRÉ</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleNotifyOpen(p)}>
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredParcels.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Aucun colis trouvé.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CALENDAR TAB --- */}
                <TabsContent value="schedule">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Gestion des Départs</CardTitle>
                            <Button variant="secondary" onClick={() => toast.info("Fonctionnalité simulée: Ajout activé")}>
                                + Ajouter un départ
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 border-b pb-2">
                                        <Truck className="h-4 w-4" /> EUROPE &rarr; CAMEROUN
                                    </h3>
                                    {schedule.eu_to_cm.map((date, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-100 rounded-sm border border-slate-200">
                                            <div className="font-mono">{new Date(date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</div>
                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-6" onClick={() => toast.info("Simulation: Départ annulé")}>
                                                Annuler
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 border-b pb-2">
                                        <Truck className="h-4 w-4" /> CAMEROUN &rarr; EUROPE
                                    </h3>
                                    {schedule.cm_to_eu.map((date, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-100 rounded-sm border border-slate-200">
                                            <div className="font-mono">{new Date(date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</div>
                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-6" onClick={() => toast.info("Simulation: Départ annulé")}>
                                                Annuler
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

        {/* NOTIFICATION DIALOG */}
        <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Notifier le Client</DialogTitle>
                    <DialogDescription>
                        Envoyer un message au destinataire ({selectedParcel?.receiver.name}) concernant le colis {selectedParcel?.tracking_id}.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Canal</Label>
                        <div className="col-span-3 flex gap-4">
                            <Button 
                                type="button" 
                                variant={notifyType === 'sms' ? 'default' : 'outline'} 
                                onClick={() => setNotifyType('sms')}
                                className="flex-1"
                            >
                                <Phone className="h-4 w-4 mr-2" /> SMS
                            </Button>
                            <Button 
                                type="button" 
                                variant={notifyType === 'email' ? 'default' : 'outline'} 
                                onClick={() => setNotifyType('email')}
                                className="flex-1"
                            >
                                <Mail className="h-4 w-4 mr-2" /> Email
                            </Button>
                        </div>
                    </div>
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
                    <Button variant="outline" onClick={() => setNotifyOpen(false)}>Annuler</Button>
                    <Button onClick={handleSendNotification} disabled={sending}>
                        {sending ? "Envoi..." : "Envoyer le message"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
