import { useState } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { BusinessProfile, CatalogItem, Client } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Edit, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Settings() {
  const { toast } = useToast();
  const { profile, setProfile, settings, setSettings, catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, clients, updateClient, deleteClient } = useInvoiceStore();

  const [p, setP] = useState<BusinessProfile>({ ...profile });
  const [newCat, setNewCat] = useState({ description: '', unit: 'pcs', unitPrice: 0 });
  const [editingCat, setEditingCat] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setP(prev => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    setProfile(p);
    toast({ title: 'Berhasil', description: 'Profil bisnis berhasil disimpan' });
  };

  const saveSettings = () => {
    setSettings(settings);
    toast({ title: 'Berhasil', description: 'Pengaturan berhasil disimpan' });
  };

  const handleAddCatalog = () => {
    if (!newCat.description) return;
    addCatalogItem({ id: crypto.randomUUID(), ...newCat });
    setNewCat({ description: '', unit: 'pcs', unitPrice: 0 });
    toast({ title: 'Berhasil', description: 'Item katalog ditambahkan' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>

      {/* Business Profile */}
      <Card>
        <CardHeader><CardTitle>Profil Bisnis</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {p.logo && <img src={p.logo} alt="Logo" className="h-16 w-16 rounded-lg object-contain border" />}
            <div>
              <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <Upload className="h-4 w-4" /> {p.logo ? 'Ganti Logo' : 'Upload Logo'}
              </Label>
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nama Perusahaan</Label>
              <Input value={p.companyName} onChange={e => setP(prev => ({ ...prev, companyName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>NPWP / Tax ID</Label>
              <Input value={p.taxId} onChange={e => setP(prev => ({ ...prev, taxId: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Alamat</Label>
              <Textarea value={p.address} onChange={e => setP(prev => ({ ...prev, address: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input value={p.phone} onChange={e => setP(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={p.email} onChange={e => setP(prev => ({ ...prev, email: e.target.value }))} />
            </div>
          </div>
          <Separator />
          <h3 className="font-semibold">Rekening Bank</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Nama Bank</Label>
              <Input value={p.bankName} onChange={e => setP(prev => ({ ...prev, bankName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nomor Rekening</Label>
              <Input value={p.bankAccountNumber} onChange={e => setP(prev => ({ ...prev, bankAccountNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Atas Nama</Label>
              <Input value={p.bankAccountHolder} onChange={e => setP(prev => ({ ...prev, bankAccountHolder: e.target.value }))} />
            </div>
          </div>
          <Button onClick={saveProfile}><Save className="mr-2 h-4 w-4" /> Simpan Profil</Button>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader><CardTitle>Format Nomor Invoice</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input value={settings.invoiceSettings.prefix} onChange={e => setSettings(prev => ({ ...prev, invoiceSettings: { ...prev.invoiceSettings, prefix: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>Nomor Berikutnya</Label>
              <Input type="number" min={1} value={settings.invoiceSettings.nextNumber} onChange={e => setSettings(prev => ({ ...prev, invoiceSettings: { ...prev.invoiceSettings, nextNumber: Number(e.target.value) } }))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={settings.invoiceSettings.yearInNumber} onCheckedChange={v => setSettings(prev => ({ ...prev, invoiceSettings: { ...prev.invoiceSettings, yearInNumber: v } }))} />
              <Label>Sertakan tahun</Label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Preview: {settings.invoiceSettings.prefix}-{settings.invoiceSettings.yearInNumber ? `${new Date().getFullYear()}-` : ''}{String(settings.invoiceSettings.nextNumber).padStart(4, '0')}
          </p>
        </CardContent>
      </Card>

      {/* Item Catalog */}
      <Card>
        <CardHeader><CardTitle>Katalog Item</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Deskripsi</Label>
              <Input value={newCat.description} onChange={e => setNewCat(prev => ({ ...prev, description: e.target.value }))} placeholder="Nama item..." />
            </div>
            <div className="w-20 space-y-1">
              <Label className="text-xs">Satuan</Label>
              <Input value={newCat.unit} onChange={e => setNewCat(prev => ({ ...prev, unit: e.target.value }))} />
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs">Harga</Label>
              <Input type="number" value={newCat.unitPrice} onChange={e => setNewCat(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} />
            </div>
            <Button size="sm" onClick={handleAddCatalog}><Plus className="h-4 w-4" /></Button>
          </div>
          {catalog.length > 0 && (
            <div className="space-y-2">
              {catalog.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span>{item.description} — {item.unit} — {item.unitPrice}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCatalogItem(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clients */}
      <Card>
        <CardHeader><CardTitle>Daftar Klien</CardTitle></CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada klien tersimpan.</p>
          ) : (
            <div className="space-y-2">
              {clients.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {c.company && <span className="text-muted-foreground"> — {c.company}</span>}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Klien?</AlertDialogTitle>
                        <AlertDialogDescription>{c.name} akan dihapus dari daftar klien.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteClient(c.id); toast({ title: 'Dihapus', description: 'Klien berhasil dihapus' }); }}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
