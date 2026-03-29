import { useState, useEffect, useRef } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { Invoice, LineItem, Client, calcLineItemSubtotal, calcInvoiceTotals, Currency, DiscountType, InvoiceStatus } from '@/types/invoice';
import { formatCurrency, generateInvoiceNumber, todayISO, addDays } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Download, Printer, GripVertical, MessageCircle } from 'lucide-react';
import { getStatusLabel, getStatusColor } from '@/lib/formatters';
import InvoicePreview from '@/components/InvoicePreview';

interface InvoiceFormProps {
  editId?: string | null;
  onNavigate: (page: string) => void;
}

const UNITS = ['pcs', 'kg', 'pack', 'box', 'unit', 'jam', 'hari', 'bulan'];

function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pcs', unitPrice: 0, discountType: 'fixed', discountValue: 0 };
}

export default function InvoiceForm({ editId, onNavigate }: InvoiceFormProps) {
  const { toast } = useToast();
  const store = useInvoiceStore();
  const { clients, profile, catalog, settings, addInvoice, updateInvoice } = store;

  const existing = editId ? store.invoices.find(i => i.id === editId) : null;

  const [invoiceNumber, setInvoiceNumber] = useState(existing?.invoiceNumber || generateInvoiceNumber(settings.invoiceSettings.prefix, settings.invoiceSettings.yearInNumber, settings.invoiceSettings.nextNumber));
  const [status, setStatus] = useState<InvoiceStatus>(existing?.status || 'draft');
  const [currency, setCurrency] = useState<Currency>(existing?.currency || 'IDR');
  const [invoiceDate, setInvoiceDate] = useState(existing?.invoiceDate || todayISO());
  const [dueDate, setDueDate] = useState(existing?.dueDate || addDays(todayISO(), 30));
  const [paymentTerms, setPaymentTerms] = useState(existing?.paymentTerms || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [footerText, setFooterText] = useState(existing?.footerText || 'Terima kasih atas kepercayaan Anda.');
  const [bilingualLabels, setBilingualLabels] = useState(existing?.bilingualLabels ?? true);

  const [selectedClientId, setSelectedClientId] = useState(existing?.clientId || '');
  const [clientForm, setClientForm] = useState<Client>(existing?.client || { id: '', name: '', company: '', address: '', phone: '', email: '' });
  const [showNewClient, setShowNewClient] = useState(false);

  const [lineItems, setLineItems] = useState<LineItem[]>(existing?.lineItems || [newLineItem()]);
  const [additionalDiscountType, setAdditionalDiscountType] = useState<DiscountType>(existing?.additionalDiscountType || 'fixed');
  const [additionalDiscountValue, setAdditionalDiscountValue] = useState(existing?.additionalDiscountValue || 0);
  const [taxType, setTaxType] = useState<'ppn11' | 'custom' | 'none'>(existing?.taxType || 'ppn11');
  const [customTaxRate, setCustomTaxRate] = useState(existing?.customTaxRate || 0);
  const [shippingCost, setShippingCost] = useState(existing?.shippingCost || 0);
  const [paidDate, setPaidDate] = useState(existing?.paidDate || '');

  const [showPreview, setShowPreview] = useState(false);

  // Select client
  useEffect(() => {
    if (selectedClientId && selectedClientId !== '__new__') {
      const c = clients.find(c => c.id === selectedClientId);
      if (c) setClientForm(c);
    }
  }, [selectedClientId, clients]);

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  const addFromCatalog = (catId: string) => {
    const cat = catalog.find(c => c.id === catId);
    if (!cat) return;
    setLineItems(prev => [...prev, { id: crypto.randomUUID(), description: cat.description, quantity: 1, unit: cat.unit, unitPrice: cat.unitPrice, discountType: 'fixed', discountValue: 0 }]);
  };

  const buildInvoice = (): Invoice => ({
    id: existing?.id || crypto.randomUUID(),
    invoiceNumber, status, currency, invoiceDate, dueDate, paymentTerms, notes,
    clientId: selectedClientId,
    client: clientForm,
    lineItems, additionalDiscountType, additionalDiscountValue,
    taxType, customTaxRate, shippingCost, paidDate, bilingualLabels, footerText,
  });

  const handleSave = () => {
    if (!clientForm.name && !clientForm.company) {
      toast({ title: 'Error', description: 'Nama klien wajib diisi', variant: 'destructive' });
      return;
    }
    if (lineItems.some(i => !i.description)) {
      toast({ title: 'Error', description: 'Deskripsi item wajib diisi', variant: 'destructive' });
      return;
    }

    // Save new client if needed
    if (showNewClient && clientForm.name) {
      const newClient = { ...clientForm, id: crypto.randomUUID() };
      store.addClient(newClient);
      setSelectedClientId(newClient.id);
      setClientForm(newClient);
    }

    const inv = buildInvoice();
    if (existing) {
      updateInvoice(inv);
      toast({ title: 'Berhasil', description: 'Invoice berhasil diperbarui' });
    } else {
      addInvoice(inv);
      toast({ title: 'Berhasil', description: 'Invoice berhasil disimpan' });
    }
    onNavigate('history');
  };

  const setDueDatePreset = (days: number) => {
    setDueDate(addDays(invoiceDate, days));
  };

  const totals = calcInvoiceTotals({ lineItems, additionalDiscountType, additionalDiscountValue, taxType, customTaxRate, shippingCost });

  const handleWhatsApp = () => {
    const inv = buildInvoice();
    const { grandTotal } = calcInvoiceTotals(inv);
    const msg = encodeURIComponent(
      `*Invoice ${inv.invoiceNumber}*\nKepada: ${inv.client.name || inv.client.company}\nTotal: ${formatCurrency(grandTotal, inv.currency)}\nJatuh tempo: ${inv.dueDate}\n\nTerima kasih!`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (showPreview) {
    return <InvoicePreview invoice={buildInvoice()} profile={profile} onBack={() => setShowPreview(false)} />;
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl">
      <div className="space-y-3">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">{existing ? 'Edit Invoice' : 'Buat Invoice Baru'}</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Printer className="mr-1.5 h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp}>
            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1.5 h-4 w-4" /> Simpan
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader><CardTitle>Detail Invoice</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Nomor Invoice</Label>
            <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as InvoiceStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mata Uang</Label>
            <Select value={currency} onValueChange={v => setCurrency(v as Currency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                <SelectItem value="USD">USD (Dollar)</SelectItem>
                <SelectItem value="SGD">SGD (Singapore)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Invoice</Label>
            <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Jatuh Tempo</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <div className="flex gap-1 flex-wrap">
              {[7, 14, 30, 60].map(d => (
                <Button key={d} variant="outline" size="sm" className="text-xs h-6" onClick={() => setDueDatePreset(d)}>
                  {d} hari
                </Button>
              ))}
            </div>
          </div>
          {status === 'paid' && (
            <div className="space-y-2">
              <Label>Tanggal Pembayaran</Label>
              <Input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} />
            </div>
          )}
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label>Syarat Pembayaran</Label>
            <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. Transfer ke rekening di bawah" />
          </div>
        </CardContent>
      </Card>

      {/* Client */}
      <Card>
        <CardHeader><CardTitle>Klien</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>Pilih Klien</Label>
              <Select value={selectedClientId} onValueChange={v => { setSelectedClientId(v); setShowNewClient(v === '__new__'); }}>
                <SelectTrigger><SelectValue placeholder="Pilih klien..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__">+ Tambah Klien Baru</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name || c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(showNewClient || selectedClientId) && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={clientForm.name} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Perusahaan</Label>
                <Input value={clientForm.company} onChange={e => setClientForm(p => ({ ...p, company: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Alamat</Label>
                <Textarea value={clientForm.address} onChange={e => setClientForm(p => ({ ...p, address: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input value={clientForm.phone} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Item</CardTitle>
            <div className="flex gap-2">
              {catalog.length > 0 && (
                <Select onValueChange={addFromCatalog}>
                  <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Dari katalog..." /></SelectTrigger>
                  <SelectContent>
                    {catalog.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" onClick={() => setLineItems(prev => [...prev, newLineItem()])}>
                <Plus className="mr-1 h-3 w-3" /> Tambah Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((item, idx) => (
            <div key={item.id} className="grid gap-2 rounded-lg border p-3 grid-cols-12 items-end">
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <Label className="text-xs">Deskripsi</Label>
                <Input value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} placeholder="Nama item/jasa..." />
              </div>
              <div className="col-span-4 sm:col-span-1 space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={0} value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))} />
              </div>
              <div className="col-span-4 sm:col-span-1 space-y-1">
                <Label className="text-xs">Satuan</Label>
                <Select value={item.unit} onValueChange={v => updateLineItem(item.id, 'unit', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <Label className="text-xs">Harga Satuan</Label>
                <Input type="number" min={0} value={item.unitPrice} onChange={e => updateLineItem(item.id, 'unitPrice', Number(e.target.value))} />
              </div>
              <div className="col-span-5 sm:col-span-2 space-y-1">
                <Label className="text-xs">Diskon</Label>
                <div className="flex gap-1">
                  <Select value={item.discountType} onValueChange={v => updateLineItem(item.id, 'discountType', v)}>
                    <SelectTrigger className="h-9 w-14"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Rp</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} value={item.discountValue} onChange={e => updateLineItem(item.id, 'discountValue', Number(e.target.value))} className="h-9" />
                </div>
              </div>
              <div className="col-span-5 sm:col-span-1 space-y-1">
                <Label className="text-xs">Subtotal</Label>
                <p className="text-sm font-semibold py-2">{formatCurrency(calcLineItemSubtotal(item), currency)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeLineItem(item.id)} disabled={lineItems.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader><CardTitle>Ringkasan Harga</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Diskon Tambahan</Label>
              <div className="flex gap-2">
                <Select value={additionalDiscountType} onValueChange={v => setAdditionalDiscountType(v as DiscountType)}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Rp</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={0} value={additionalDiscountValue} onChange={e => setAdditionalDiscountValue(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pajak</Label>
              <Select value={taxType} onValueChange={v => setTaxType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ppn11">PPN 11%</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="none">Tanpa Pajak</SelectItem>
                </SelectContent>
              </Select>
              {taxType === 'custom' && (
                <Input type="number" min={0} max={100} value={customTaxRate} onChange={e => setCustomTaxRate(Number(e.target.value))} placeholder="Rate %" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Biaya Pengiriman</Label>
              <Input type="number" min={0} value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2 text-right">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(totals.subtotal, currency)}</span></div>
            {totals.additionalDiscount > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Diskon</span><span>-{formatCurrency(totals.additionalDiscount, currency)}</span></div>
            )}
            {totals.taxRate > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Pajak ({totals.taxRate}%)</span><span>{formatCurrency(totals.taxAmount, currency)}</span></div>
            )}
            {shippingCost > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Pengiriman</span><span>{formatCurrency(shippingCost, currency)}</span></div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span>{formatCurrency(totals.grandTotal, currency)}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>Catatan & Pengaturan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Catatan / Syarat & Ketentuan</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Catatan tambahan..." />
          </div>
          <div className="space-y-2">
            <Label>Teks Footer</Label>
            <Input value={footerText} onChange={e => setFooterText(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={bilingualLabels} onCheckedChange={setBilingualLabels} />
            <Label>Label bilingual (Indonesia + Inggris)</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
