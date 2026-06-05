import { useState } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { BusinessProfile } from '@/types/invoice';
import { isValidIndonesianPhone, isValidEmail } from '@/lib/validators';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Settings() {
  const { toast } = useToast();
  const { profile, setProfile, settings, setSettings } = useInvoiceStore();

  const [p, setP] = useState<BusinessProfile>({ ...profile });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setP(prev => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    const phone = p.phone.trim();
    const email = p.email.trim();
    if (!phone) {
      toast({ title: 'Periksa input', description: 'No. HP wajib diisi', variant: 'destructive' });
      return;
    }
    if (!isValidIndonesianPhone(phone)) {
      toast({ title: 'Periksa input', description: 'Format No. HP tidak valid (min 10 digit, diawali 08/62)', variant: 'destructive' });
      return;
    }
    if (email && !isValidEmail(email)) {
      toast({ title: 'Periksa input', description: 'Format email tidak valid', variant: 'destructive' });
      return;
    }
    setProfile({ ...p, phone, email });
    toast({ title: '✅ Tersimpan', description: 'Profil usaha berhasil disimpan' });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-foreground">Pengaturan</h1>

      <Card>
        <CardHeader><CardTitle>🏪 Profil Usaha</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {p.logo && <img src={p.logo} alt={`Logo ${p.companyName || 'usaha'}`} className="h-12 w-12 rounded-lg object-contain border" />}
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
            <Label className="text-xs">No. HP <span className="text-destructive">*</span></Label>
            <Input value={p.phone} onChange={e => setP(prev => ({ ...prev, phone: e.target.value }))} className="h-10" placeholder="08xx..." />
          </div>

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
