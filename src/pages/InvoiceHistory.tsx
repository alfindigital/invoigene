import { useState } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { calcInvoiceTotals } from '@/types/invoice';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Copy, Trash2, CheckCircle, Eye, Download } from 'lucide-react';

interface InvoiceHistoryProps {
  onNavigate: (page: string) => void;
  onEdit: (id: string) => void;
  onPreview?: (id: string) => void;
}

export default function InvoiceHistory({ onNavigate, onEdit, onPreview }: InvoiceHistoryProps) {
  const { toast } = useToast();
  const { invoices, deleteInvoice, updateInvoice, addInvoice, settings, setSettings } = useInvoiceStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || inv.client.name.toLowerCase().includes(search.toLowerCase()) || inv.client.company.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paidDate: undefined,
    };
    addInvoice(dup);
    toast({ title: 'Berhasil', description: 'Invoice berhasil diduplikasi' });
  };

  const handleMarkPaid = (inv: typeof invoices[0]) => {
    updateInvoice({ ...inv, status: 'paid', paidDate: new Date().toISOString().split('T')[0] });
    toast({ title: 'Berhasil', description: 'Invoice ditandai lunas' });
  };

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    toast({ title: 'Dihapus', description: 'Invoice berhasil dihapus' });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-foreground">Riwayat Invoice</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari invoice atau klien..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Terkirim</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
            <SelectItem value="overdue">Jatuh Tempo</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {invoices.length === 0 ? 'Belum ada invoice.' : 'Tidak ada invoice yang cocok dengan filter.'}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {filtered.map(inv => {
              const { grandTotal } = calcInvoiceTotals(inv);
              return (
                <Card key={inv.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{inv.client.name || inv.client.company}</p>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(inv.status)}>
                        {getStatusLabel(inv.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">{formatDate(inv.invoiceDate)}</span>
                      <span className="font-bold text-sm">{formatCurrency(grandTotal, inv.currency)}</span>
                    </div>
                    <div className="flex gap-1 justify-end border-t pt-2">
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkPaid(inv)} title="Tandai Lunas">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {onPreview && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPreview(inv.id)} title="Preview & PDF">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(inv.id)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(inv)}><Copy className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Invoice?</AlertDialogTitle>
                            <AlertDialogDescription>Invoice {inv.invoiceNumber} akan dihapus permanen.</AlertDialogDescription>
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

          {/* Desktop table view */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Klien</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(inv => {
                  const { grandTotal } = calcInvoiceTotals(inv);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.client.name || inv.client.company}</TableCell>
                      <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                      <TableCell>{formatCurrency(grandTotal, inv.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(inv.status)}>
                          {getStatusLabel(inv.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkPaid(inv)} title="Tandai Lunas">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {onPreview && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPreview(inv.id)} title="Preview & PDF">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(inv.id)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(inv)}><Copy className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Invoice?</AlertDialogTitle>
                                <AlertDialogDescription>Invoice {inv.invoiceNumber} akan dihapus permanen.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(inv.id)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
