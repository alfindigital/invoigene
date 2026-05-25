import { useState } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

export default function Items() {
  const { toast } = useToast();
  const { catalog, addCatalogItem, deleteCatalogItem } = useInvoiceStore();
  const [newCat, setNewCat] = useState({ description: '', unit: 'pcs', unitPrice: 0 });

  const handleAdd = () => {
    if (!newCat.description) return;
    addCatalogItem({ id: crypto.randomUUID(), ...newCat });
    setNewCat({ description: '', unit: 'pcs', unitPrice: 0 });
    toast({ title: '✅ Ditambahkan', description: 'Item katalog berhasil ditambahkan' });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-foreground">Item</h1>
      <Card>
        <CardHeader><CardTitle>📦 Katalog Produk</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Tambahkan produk yang sering dijual agar bisa ditambah ke nota dengan sekali tap.</p>
          <div className="grid gap-2 grid-cols-[1fr_60px_80px_auto] items-end">
            <div className="space-y-1">
              <Label className="text-xs">Nama</Label>
              <Input value={newCat.description} onChange={e => setNewCat(p => ({ ...p, description: e.target.value }))} placeholder="Nasi Goreng..." className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Satuan</Label>
              <Input value={newCat.unit} onChange={e => setNewCat(p => ({ ...p, unit: e.target.value }))} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Harga</Label>
              <Input type="number" value={newCat.unitPrice} onChange={e => setNewCat(p => ({ ...p, unitPrice: Number(e.target.value) }))} className="h-9" />
            </div>
            <Button size="icon" className="h-9 w-9" onClick={handleAdd} disabled={!newCat.description} aria-label="Tambah item katalog">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {catalog.length > 0 ? (
            <div className="space-y-1.5">
              {catalog.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <div>
                    <span className="font-medium">{item.description}</span>
                    <span className="text-muted-foreground ml-1">· {item.unit} · {formatCurrency(item.unitPrice)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteCatalogItem(item.id)} aria-label={`Hapus ${item.description}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Belum ada item. Tambahkan item pertama Anda di atas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
