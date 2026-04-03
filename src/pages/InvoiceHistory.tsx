import { useState } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { calcInvoiceTotals } from '@/types/invoice';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, getBuyerDisplay, buildWhatsAppNotaMessage, openWhatsApp } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Copy, Trash2, CheckCircle, Eye, ArrowUpDown, MessageCircle } from 'lucide-react';

interface InvoiceHistoryProps {
  onNavigate: (page: string) => void;
  onEdit: (id: string) => void;
  onPreview?: (id: string) => void;
}

export default function InvoiceHistory({ onEdit, onPreview }: InvoiceHistoryProps) {
  const { toast } = useToast();
  const { invoices, deleteInvoice, updateInvoice, addInvoice, settings, profile } = useInvoiceStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'status'>('date-desc');

  const statusOrder: Record<string, number> = { overdue: 0, sent: 1, draft: 2, paid: 3, cancelled: 4 };

  const filtered = invoices.filter(inv => {
    const buyer = getBuyerDisplay(inv);
    const matchSearch = !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || buyer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date-asc': return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
      case 'date-desc': return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
      case 'total-desc': return calcInvoiceTotals(b).grandTotal - calcInvoiceTotals(a).grandTotal;
      case 'total-asc': return calcInvoiceTotals(a).grandTotal - calcInvoiceTotals(b).grandTotal;
      case 'status': return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      default: return 0;
    }
  });

  const handleWhatsApp = (inv: typeof invoices[0]) => {
    const { grandTotal } = calcInvoiceTotals(inv);
    const msg = buildWhatsAppNotaMessage(inv, grandTotal, profile);
    openWhatsApp(inv.buyerPhone || '', msg);
  };

  const handleDuplicate = (inv: typeof invoices[0]) => {
    const newNum = settings.invoiceSettings.nextNumber;
    const prefix = settings.invoiceSettings.prefix;
    const year = new Date().getFullYear();
    const numStr = String(newNum).padStart(4, '0');
    const invoiceNumber = settings.invoiceSettings.yearInNumber ? `${prefix}-${year}-${numStr}` : `${prefix}-${numStr}`;
    const dup = {
      ...inv,
      id: crypto.randomUUID(),
      invoiceNumber,
      status: 'draft' as const,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      paidDate: undefined,
    };
    addInvoice(dup);
    toast({ title: 'Berhasil', description: 'Nota berhasil diduplikasi' });
  };

  const handleMarkPaid = (inv: typeof invoices[0]) => {
    updateInvoice({ ...inv, status: 'paid', paidDate: new Date().toISOString().split('T')[0] });
    toast({ title: '✅ Lunas', description: 'Nota ditandai lunas' });
  };

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    toast({ title: 'Dihapus', description: 'Nota berhasil dihapus' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Riwayat Nota</h1>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-10" placeholder="Cari nota atau pembeli..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px] h-10"><SelectValue placeholder="Semua" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Terkirim</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
            <SelectItem value="overdue">Jatuh Tempo</SelectItem>
            <SelectItem value="cancelled">Batal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-[150px] h-10">
            <ArrowUpDown className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Urut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Terbaru</SelectItem>
            <SelectItem value="date-asc">Terlama</SelectItem>
            <SelectItem value="total-desc">Terbesar</SelectItem>
            <SelectItem value="total-asc">Terkecil</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {invoices.length === 0 ? 'Belum ada nota.' : 'Tidak ada nota yang cocok.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => {
            const { grandTotal } = calcInvoiceTotals(inv);
            const buyer = getBuyerDisplay(inv);
            return (
              <Card key={inv.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{buyer}</p>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(inv.status)}>
                      {getStatusLabel(inv.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{formatDate(inv.invoiceDate)}</span>
                    <span className="font-bold text-sm">{formatCurrency(grandTotal)}</span>
                  </div>
                  <div className="flex gap-1 justify-end border-t border-border/50 pt-2">
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkPaid(inv)} title="Lunas">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {onPreview && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPreview(inv.id)} title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleWhatsApp(inv)} title="WhatsApp"><MessageCircle className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(inv.id)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(inv)}><Copy className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Nota?</AlertDialogTitle>
                          <AlertDialogDescription>Nota {inv.invoiceNumber} akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(inv.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
