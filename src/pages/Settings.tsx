import { useState } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { BusinessProfile, CatalogItem } from '@/types/invoice';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Settings() {
  const { toast } = useToast();
  const { profile, setProfile, settings, setSettings, catalog, addCatalogItem, deleteCatalogItem } = useInvoiceStore();

  const [p, setP] = useState<BusinessProfile>({ ...profile });
  const [newCat, setNewCat] = useState({ description: '', unit: 'pcs', unitPrice: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setP(prev => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    setProfile(p);
    toast({ title: '✅ Tersimpan', description: 'Profil usaha berhasil disimpan' });
  };

  const handleAddCatalog = () => {
    if (!newCat.description) return;
    addCatalogItem({ id: crypto.randomUUID(), ...newCat });
    setNewCat({ description: '', unit: 'pcs', unitPrice: 0 });
    toast({ title: '✅ Ditambahkan', description: 'Item katalog berhasil ditambahkan' });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-foreground">Pengaturan</h1>

      {/* Catalog — primary feature */}
      <Card>
        <CardHeader><CardTitle>📦 Katalog Produk</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Tambahkan produk yang sering dijual agar bisa ditambah ke nota dengan sekali tap.</p>
          <div className="grid gap-2 grid-cols-[1fr_60px_80px_auto] items-end">
            <div className="space-y-1">
              <Label className="text-xs">Nama</Label>
              <Input value={newCat.description} onChange={e => setNewCat(prev => ({ ...prev, description: e.target.value }))} placeholder="Nasi Goreng..." className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Satuan</Label>
              <Input value={newCat.unit} onChange={e => setNewCat(prev => ({ ...prev, unit: e.target.value }))} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Harga</Label>
              <Input type="number" value={newCat.unitPrice} onChange={e => setNewCat(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} className="h-9" />
            </div>
            <Button size="icon" className="h-9 w-9" onClick={handleAddCatalog} disabled={!newCat.description}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {catalog.length > 0 && (
            <div className="space-y-1.5">
              {catalog.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <div>
                    <span className="font-medium">{item.description}</span>
                    <span className="text-muted-foreground ml-1">· {item.unit} · {formatCurrency(item.unitPrice)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteCatalogItem(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Profile — simplified */}
      <Card>
        <CardHeader><CardTitle>🏪 Profil Usaha</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {p.logo && <img src={p.logo} alt="Logo" className="h-12 w-12 rounded-lg object-contain border" />}
            <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Upload className="h-4 w-4" /> {p.logo ? 'Ganti Logo' : 'Upload Logo'}
            </Label>
            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nama Usaha</Label>
            <Input value={p.companyName} onChange={e => setP(prev => ({ ...prev, companyName: e.target.value }))} className="h-10" placeholder="Warung Makan Barokah..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alamat</Label>
            <Input value={p.address} onChange={e => setP(prev => ({ ...prev, address: e.target.value }))} className="h-10" placeholder="Jl. Pasar No. 5..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">No. HP</Label>
            <Input value={p.phone} onChange={e => setP(prev => ({ ...prev, phone: e.target.value }))} className="h-10" placeholder="08xx..." />
          </div>

          {/* Advanced profile fields */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1">
                {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Info tambahan (email, NPWP, rekening)
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={p.email} onChange={e => setP(prev => ({ ...prev, email: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">NPWP</Label>
                  <Input value={p.taxId} onChange={e => setP(prev => ({ ...prev, taxId: e.target.value }))} className="h-9" />
                </div>
              </div>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground">Rekening Bank (untuk nota & QR)</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Bank</Label>
                  <Input value={p.bankName} onChange={e => setP(prev => ({ ...prev, bankName: e.target.value }))} className="h-9" placeholder="BCA" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">No. Rek</Label>
                  <Input value={p.bankAccountNumber} onChange={e => setP(prev => ({ ...prev, bankAccountNumber: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Atas Nama</Label>
                  <Input value={p.bankAccountHolder} onChange={e => setP(prev => ({ ...prev, bankAccountHolder: e.target.value }))} className="h-9" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button onClick={saveProfile} className="w-full"><Save className="mr-2 h-4 w-4" /> Simpan Profil</Button>
        </CardContent>
      </Card>

      {/* Invoice Number Format */}
      <Card>
        <CardHeader><CardTitle>🔢 Format Nomor Nota</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Prefix</Label>
              <Input value={settings.invoiceSettings.prefix} onChange={e => setSettings(prev => ({ ...prev, invoiceSettings: { ...prev.invoiceSettings, prefix: e.target.value } }))} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nomor Berikutnya</Label>
              <Input type="number" min={1} value={settings.invoiceSettings.nextNumber} onChange={e => setSettings(prev => ({ ...prev, invoiceSettings: { ...prev.invoiceSettings, nextNumber: Number(e.target.value) } }))} className="h-9" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={settings.invoiceSettings.yearInNumber} onCheckedChange={v => setSettings(prev => ({ ...prev, invoiceSettings: { ...prev.invoiceSettings, yearInNumber: v } }))} />
            <Label className="text-xs">Sertakan tahun</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview: {settings.invoiceSettings.prefix}-{settings.invoiceSettings.yearInNumber ? `${new Date().getFullYear()}-` : ''}{String(settings.invoiceSettings.nextNumber).padStart(4, '0')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
