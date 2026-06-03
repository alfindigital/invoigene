import { useState, useMemo, useRef, useEffect } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { Invoice, LineItem, InvoiceTemplate, calcLineItemSubtotal, calcInvoiceTotals, DiscountType } from '@/types/invoice';
import { formatCurrency, generateInvoiceNumber, todayISO, addDays, buildWhatsAppNotaMessage, openWhatsApp } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Trash2, Save, MessageCircle, ChevronDown, ChevronUp, ShoppingBag, Flame, BookmarkPlus, BookMarked } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InvoicePreview from '@/components/InvoicePreview';

interface InvoiceFormProps {
  editId?: string | null;
  onNavigate: (page: string) => void;
}

export default function InvoiceForm({ editId, onNavigate }: InvoiceFormProps) {
  const { toast } = useToast();
  const store = useInvoiceStore();
  const { profile, catalog, settings, addInvoice, updateInvoice, templates, addTemplate, deleteTemplate } = store;

  const existing = editId ? store.invoices.find(i => i.id === editId) : null;

  const [buyerName, setBuyerName] = useState(existing?.buyerName || existing?.client?.name || '');
  const [buyerPhone, setBuyerPhone] = useState(existing?.buyerPhone || existing?.client?.phone || '');
  const [lineItems, setLineItems] = useState<LineItem[]>(existing?.lineItems || []);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [additionalDiscountType, setAdditionalDiscountType] = useState<DiscountType>(existing?.additionalDiscountType || 'fixed');
  const [additionalDiscountValue, setAdditionalDiscountValue] = useState(existing?.additionalDiscountValue || 0);
  const [taxType, setTaxType] = useState<'ppn11' | 'custom' | 'none'>(existing?.taxType || 'none');
  const [customTaxRate, setCustomTaxRate] = useState(existing?.customTaxRate || 0);
  const [shippingCost, setShippingCost] = useState(existing?.shippingCost || 0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const [manualDesc, setManualDesc] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  const invoiceNumber = existing?.invoiceNumber || generateInvoiceNumber(settings.invoiceSettings.prefix, settings.invoiceSettings.yearInNumber, settings.invoiceSettings.nextNumber);

  // Calculate bestsellers from invoice history
  const bestsellerIds = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const inv of store.invoices) {
      for (const item of inv.lineItems) {
        const match = catalog.find(c => c.description === item.description && c.unitPrice === item.unitPrice);
        if (match) {
          freq[match.id] = (freq[match.id] || 0) + item.quantity;
        }
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .filter(([, count]) => count >= 2)
      .map(([id]) => id);
  }, [store.invoices, catalog]);

  const lastAddedIdRef = useRef<string | null>(null);

  const addFromCatalog = (catId: string) => {
    const cat = catalog.find(c => c.id === catId);
    if (!cat) return;
    const existingItem = lineItems.find(i => i.description === cat.description && i.unitPrice === cat.unitPrice);
    if (existingItem) {
      lastAddedIdRef.current = existingItem.id;
      setLineItems(prev => prev.map(i => i.id === existingItem.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      const newId = crypto.randomUUID();
      lastAddedIdRef.current = newId;
      setLineItems(prev => [...prev, { id: newId, description: cat.description, quantity: 1, unit: cat.unit, unitPrice: cat.unitPrice, discountType: 'fixed', discountValue: 0 }]);
    }
  };

  const handleManualAdd = () => {
    if (!manualDesc || !manualPrice) return;
    const newId = crypto.randomUUID();
    lastAddedIdRef.current = newId;
    setLineItems(prev => [...prev, { id: newId, description: manualDesc, quantity: 1, unit: 'pcs', unitPrice: Number(manualPrice), discountType: 'fixed', discountValue: 0 }]);
    setManualDesc('');
    setManualPrice('');
  };

  const updateQty = (id: string, delta: number) => {
    setLineItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(0, i.quantity + delta);
      return { ...i, quantity: newQty };
    }).filter(i => i.quantity > 0));
  };

  const removeItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  const totals = calcInvoiceTotals({ lineItems, additionalDiscountType, additionalDiscountValue, taxType, customTaxRate, shippingCost });

  const buildInvoice = (): Invoice => ({
    id: existing?.id || crypto.randomUUID(),
    invoiceNumber,
    status: existing?.status || 'draft',
    currency: 'IDR',
    invoiceDate: existing?.invoiceDate || todayISO(),
    dueDate: existing?.dueDate || addDays(todayISO(), 7),
    notes, buyerName, buyerPhone, lineItems,
    additionalDiscountType, additionalDiscountValue,
    taxType, customTaxRate, shippingCost,
    paidDate: existing?.paidDate,
  });

  const handleSave = (sendWA = false) => {
    if (lineItems.length === 0) {
      toast({ title: 'Oops', description: 'Tambahkan minimal 1 item', variant: 'destructive' });
      return;
    }
    const inv = buildInvoice();
    if (existing) {
      updateInvoice(inv);
      toast({ title: '✅ Tersimpan', description: 'Nota berhasil diperbarui' });
    } else {
      addInvoice(inv);
      toast({ title: '✅ Tersimpan', description: `Nota ${inv.invoiceNumber} berhasil dibuat` });
    }
    if (sendWA) {
      const msg = buildWhatsAppNotaMessage(inv, totals.grandTotal, profile);
      openWhatsApp(buyerPhone, msg);
    }
    onNavigate('history');
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || lineItems.length === 0) {
      toast({ title: 'Oops', description: 'Beri nama template dan tambahkan minimal 1 item', variant: 'destructive' });
      return;
    }
    const tpl: InvoiceTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      buyerName, buyerPhone,
      lineItems: lineItems.map(i => ({ ...i, id: crypto.randomUUID() })),
      notes, additionalDiscountType, additionalDiscountValue,
      taxType, customTaxRate, shippingCost,
      createdAt: todayISO(),
    };
    addTemplate(tpl);
    setTemplateName('');
    toast({ title: '✅ Template Disimpan', description: `"${tpl.name}" siap digunakan` });
  };

  const loadTemplate = (tpl: InvoiceTemplate) => {
    setBuyerName(tpl.buyerName);
    setBuyerPhone(tpl.buyerPhone);
    setLineItems(tpl.lineItems.map(i => ({ ...i, id: crypto.randomUUID() })));
    setNotes(tpl.notes);
    setAdditionalDiscountType(tpl.additionalDiscountType);
    setAdditionalDiscountValue(tpl.additionalDiscountValue);
    setTaxType(tpl.taxType);
    setCustomTaxRate(tpl.customTaxRate);
    setShippingCost(tpl.shippingCost);
    setShowTemplates(false);
    toast({ title: '📋 Template Dimuat', description: `"${tpl.name}" berhasil dimuat` });
  };

  const stickyBarRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [stickyHeight, setStickyHeight] = useState(220);

  useEffect(() => {
    const el = stickyBarRef.current;
    if (!el) return;
    const update = () => setStickyHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [lineItems.length, showAdvanced, shippingCost, taxType, totals.additionalDiscount, totals.taxRate]);

  // Auto-scroll added/updated line item into view above the sticky bar
  useEffect(() => {
    const id = lastAddedIdRef.current;
    if (!id) return;
    const node = itemRefs.current[id];
    if (!node) return;
    const barH = stickyBarRef.current?.offsetHeight ?? stickyHeight;
    const rect = node.getBoundingClientRect();
    const safeBottom = window.innerHeight - barH - 16;
    if (rect.bottom > safeBottom || rect.top < 80) {
      const target = window.scrollY + rect.top - (window.innerHeight - barH) / 2;
      window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }
    lastAddedIdRef.current = null;
  }, [lineItems, stickyHeight]);

  if (showPreview) {
    return <InvoicePreview invoice={buildInvoice()} profile={profile} onBack={() => setShowPreview(false)} />;
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto" style={{ paddingBottom: stickyHeight + 24 }}>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">{existing ? 'Edit Nota' : 'Nota Baru'}</h1>
        {templates.length > 0 && (
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowTemplates(!showTemplates)}>
            <BookMarked className="h-3.5 w-3.5" /> Template ({templates.length})
          </Button>
        )}
      </div>

      {/* Template picker */}
      {showTemplates && templates.length > 0 && (
        <div className="space-y-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-medium text-muted-foreground">📋 Pilih template untuk dimuat:</p>
          <div className="space-y-1.5">
            {templates.map(tpl => (
              <div key={tpl.id} className="flex items-center justify-between rounded-lg border bg-card p-2.5">
                <button onClick={() => loadTemplate(tpl)} className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tpl.lineItems.length} item · {tpl.buyerName || 'Tanpa pembeli'}
                  </p>
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteTemplate(tpl.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buyer info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Nama Pembeli (opsional)</Label>
          <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Pak Budi..." className="h-10" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">No. HP (opsional)</Label>
          <Input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="08xx..." className="h-10" />
        </div>
      </div>

      {/* Quick-add catalog grid */}
      {catalog.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> Tap untuk tambah:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[...catalog]
              .sort((a, b) => {
                const aTop = bestsellerIds.indexOf(a.id);
                const bTop = bestsellerIds.indexOf(b.id);
                if (aTop !== -1 && bTop !== -1) return aTop - bTop;
                if (aTop !== -1) return -1;
                if (bTop !== -1) return 1;
                return 0;
              })
              .map(cat => {
              const inCart = lineItems.find(i => i.description === cat.description && i.unitPrice === cat.unitPrice);
              const isBestseller = bestsellerIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => addFromCatalog(cat.id)}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 ${
                    inCart
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : isBestseller
                        ? 'border-orange-400/70 bg-orange-50/50 dark:bg-orange-950/20 hover:border-orange-400'
                        : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  {isBestseller && (
                    <span className="absolute -top-1.5 -left-1.5 flex items-center justify-center h-5 w-5 rounded-full bg-orange-500 text-white shadow">
                      <Flame className="h-3 w-3" />
                    </span>
                  )}
                  <p className="text-sm font-medium truncate">{cat.description}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(cat.unitPrice)}</p>
                  {inCart && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow">
                      {inCart.quantity}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual add row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Item manual</Label>
          <Input value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="Nama item..." className="h-10" />
        </div>
        <div className="w-24 space-y-1">
          <Label className="text-xs text-muted-foreground">Harga</Label>
          <Input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="0" className="h-10" />
        </div>
        <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleManualAdd} disabled={!manualDesc || !manualPrice} aria-label="Tambah item manual">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Line items list */}
      {lineItems.length > 0 && (
        <div className="space-y-2 rounded-xl border bg-card p-3">
          {lineItems.map(item => (
            <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }} className="flex items-center gap-2 scroll-mt-24">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} × {item.quantity} = {formatCurrency(calcLineItemSubtotal(item))}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, -1)} aria-label={`Kurangi jumlah ${item.description}`}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, 1)} aria-label={`Tambah jumlah ${item.description}`}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)} aria-label={`Hapus ${item.description}`}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save as template */}
      {lineItems.length > 0 && !existing && (
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Simpan sebagai template</Label>
            <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Pesanan Harian Pak Budi..." className="h-9" />
          </div>
          <Button variant="secondary" size="sm" className="h-9 gap-1 shrink-0" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
            <BookmarkPlus className="h-3.5 w-3.5" /> Simpan
          </Button>
        </div>
      )}

      {/* Advanced options (collapsed) */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-2">
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Opsi lanjutan (diskon, pajak, ongkir, catatan)
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Diskon</Label>
              <div className="flex gap-1">
                <Select value={additionalDiscountType} onValueChange={v => setAdditionalDiscountType(v as DiscountType)}>
                  <SelectTrigger className="w-16 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Rp</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={0} value={additionalDiscountValue} onChange={e => setAdditionalDiscountValue(Number(e.target.value))} className="h-9" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pajak</Label>
              <Select value={taxType} onValueChange={v => setTaxType(v as 'ppn11' | 'custom' | 'none')}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Pajak</SelectItem>
                  <SelectItem value="ppn11">PPN 11%</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {taxType === 'custom' && (
                <Input type="number" min={0} max={100} value={customTaxRate} onChange={e => setCustomTaxRate(Number(e.target.value))} placeholder="%" className="h-9 mt-1" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ongkos Kirim</Label>
            <Input type="number" min={0} value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Catatan</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..." className="h-9" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sticky total bar */}
      <div ref={stickyBarRef} className="sticky bottom-20 md:bottom-4 z-30 rounded-2xl border bg-card/95 backdrop-blur-lg shadow-xl p-4 space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal ({lineItems.length} item)</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.additionalDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon</span>
              <span>-{formatCurrency(totals.additionalDiscount)}</span>
            </div>
          )}
          {totals.taxRate > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pajak ({totals.taxRate}%)</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
          )}
          {shippingCost > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ongkir</span>
              <span>{formatCurrency(shippingCost)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-1 border-t border-border">
            <span>Total</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12 text-sm font-semibold" onClick={() => handleSave(false)}>
            <Save className="mr-1.5 h-4 w-4" /> Simpan
          </Button>
          <Button className="h-12 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSave(true)}>
            <MessageCircle className="mr-1.5 h-4 w-4" /> Simpan & WA
          </Button>
        </div>
      </div>
    </div>
  );
}
