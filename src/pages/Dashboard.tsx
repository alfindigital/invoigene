import { useMemo, useState } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { calcInvoiceTotals, Invoice } from '@/types/invoice';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, getBuyerDisplay, todayISO } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Clock, DollarSign, Database, TrendingUp, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportCSV, exportPDF } from '@/lib/exportReport';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

type ChartRange = '7d' | '14d' | '30d';

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { invoices, addInvoice } = useInvoiceStore();
  const { toast } = useToast();
  const [chartRange, setChartRange] = useState<ChartRange>('7d');

  const today = todayISO();

  const seedDummyData = () => {
    const dummyInvoices: Invoice[] = [
      {
        id: crypto.randomUUID(), invoiceNumber: 'NT-2026-0001', status: 'paid', currency: 'IDR',
        invoiceDate: today, dueDate: today, notes: '',
        buyerName: 'Pak Budi', buyerPhone: '081234567890',
        lineItems: [
          { id: crypto.randomUUID(), description: 'Nasi Goreng Spesial', quantity: 2, unit: 'porsi', unitPrice: 18000, discountType: 'fixed', discountValue: 0 },
          { id: crypto.randomUUID(), description: 'Es Teh Manis', quantity: 3, unit: 'gelas', unitPrice: 5000, discountType: 'fixed', discountValue: 0 },
        ],
        additionalDiscountType: 'fixed', additionalDiscountValue: 0, taxType: 'none', customTaxRate: 0, shippingCost: 0, paidDate: today,
      },
      {
        id: crypto.randomUUID(), invoiceNumber: 'NT-2026-0002', status: 'paid', currency: 'IDR',
        invoiceDate: today, dueDate: today, notes: '',
        buyerName: 'Bu Siti', buyerPhone: '087654321098',
        lineItems: [
          { id: crypto.randomUUID(), description: 'Bakso Urat', quantity: 3, unit: 'mangkok', unitPrice: 15000, discountType: 'fixed', discountValue: 0 },
          { id: crypto.randomUUID(), description: 'Es Jeruk', quantity: 2, unit: 'gelas', unitPrice: 7000, discountType: 'fixed', discountValue: 0 },
        ],
        additionalDiscountType: 'fixed', additionalDiscountValue: 0, taxType: 'none', customTaxRate: 0, shippingCost: 0, paidDate: today,
      },
      {
        id: crypto.randomUUID(), invoiceNumber: 'NT-2026-0003', status: 'sent', currency: 'IDR',
        invoiceDate: today, dueDate: today, notes: 'Pesan antar',
        buyerName: 'Mas Agus', buyerPhone: '089876543210',
        lineItems: [
          { id: crypto.randomUUID(), description: 'Mie Ayam Bakso', quantity: 5, unit: 'porsi', unitPrice: 15000, discountType: 'fixed', discountValue: 0 },
        ],
        additionalDiscountType: 'fixed', additionalDiscountValue: 0, taxType: 'none', customTaxRate: 0, shippingCost: 5000,
      },
      {
        id: crypto.randomUUID(), invoiceNumber: 'NT-2026-0004', status: 'draft', currency: 'IDR',
        invoiceDate: today, dueDate: today, notes: '',
        buyerName: '', buyerPhone: '',
        lineItems: [
          { id: crypto.randomUUID(), description: 'Nasi Goreng Spesial', quantity: 1, unit: 'porsi', unitPrice: 18000, discountType: 'fixed', discountValue: 0 },
          { id: crypto.randomUUID(), description: 'Es Teh Manis', quantity: 1, unit: 'gelas', unitPrice: 5000, discountType: 'fixed', discountValue: 0 },
        ],
        additionalDiscountType: 'fixed', additionalDiscountValue: 0, taxType: 'none', customTaxRate: 0, shippingCost: 0,
      },
    ];
    dummyInvoices.forEach(inv => addInvoice(inv));
    toast({ title: 'Berhasil', description: `${dummyInvoices.length} nota dummy ditambahkan` });
  };

  const stats = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => {
        const { grandTotal } = calcInvoiceTotals(inv);
        const isToday = inv.invoiceDate === today;
        acc.total++;
        if (isToday) { acc.todayCount++; acc.todayRevenue += grandTotal; }
        acc.revenue += inv.status === 'paid' ? grandTotal : 0;
        acc.outstanding += (inv.status === 'sent' || inv.status === 'overdue') ? grandTotal : 0;
        return acc;
      },
      { total: 0, todayCount: 0, todayRevenue: 0, revenue: 0, outstanding: 0 },
    );
  }, [invoices, today]);

  // Chart data: daily revenue for the selected range
  const chartData = useMemo(() => {
    const days = chartRange === '7d' ? 7 : chartRange === '14d' ? 14 : 30;
    const result: { date: string; label: string; pendapatan: number; nota: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({ date: dateStr, label: getDayLabel(dateStr), pendapatan: 0, nota: 0 });
    }

    for (const inv of invoices) {
      const entry = result.find(r => r.date === inv.invoiceDate);
      if (entry) {
        const { grandTotal } = calcInvoiceTotals(inv);
        entry.pendapatan += grandTotal;
        entry.nota++;
      }
    }

    return result;
  }, [invoices, chartRange]);

  // Weekly summary
  const weeklySummary = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];

    let revenue = 0;
    let count = 0;
    for (const inv of invoices) {
      if (inv.invoiceDate >= weekStr) {
        const { grandTotal } = calcInvoiceTotals(inv);
        revenue += grandTotal;
        count++;
      }
    }
    return { revenue, count, avgPerDay: count > 0 ? Math.round(revenue / 7) : 0 };
  }, [invoices]);

  const recent = invoices.slice(0, 5);

  const formatChartTooltip = (value: number) => formatCurrency(value);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        {invoices.length === 0 && (
          <Button size="sm" variant="outline" onClick={seedDummyData}>
            <Database className="mr-1.5 h-4 w-4" /> Data Contoh
          </Button>
        )}
      </div>

      {/* Big CTA */}
      <Button className="w-full h-14 text-base font-bold rounded-2xl shadow-lg" onClick={() => onNavigate('new')}>
        <Plus className="mr-2 h-5 w-5" /> Buat Nota Baru
      </Button>

      <div className="grid gap-3 grid-cols-2">
        {[
          { label: 'Nota Hari Ini', value: stats.todayCount, icon: FileText, color: 'from-primary/80 to-primary' },
          { label: 'Pendapatan Hari Ini', value: formatCurrency(stats.todayRevenue), icon: DollarSign, color: 'from-emerald-500/80 to-emerald-600' },
          { label: 'Total Pendapatan', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'from-blue-500/80 to-blue-600' },
          { label: 'Belum Dibayar', value: formatCurrency(stats.outstanding), icon: Clock, color: 'from-amber-500/80 to-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 shadow-lg shadow-primary/5 hover:shadow-xl transition-all"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} opacity-80`} />
            <div className="relative flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
              <div className={`flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br ${color} text-white shadow`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="relative text-lg font-bold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      {/* Weekly summary cards */}
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card/60 p-3 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">7 Hari Terakhir</p>
          <p className="text-sm font-bold text-foreground mt-1">{weeklySummary.count} nota</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-3 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Pendapatan 7 Hari</p>
          <p className="text-sm font-bold text-foreground mt-1">{formatCurrency(weeklySummary.revenue)}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-3 text-center">
          <p className="text-[10px] text-muted-foreground font-medium">Rata-rata / Hari</p>
          <p className="text-sm font-bold text-foreground mt-1">{formatCurrency(weeklySummary.avgPerDay)}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tren Pendapatan</h2>
          </div>
          <div className="flex gap-1">
            {(['7d', '14d', '30d'] as ChartRange[]).map(range => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  chartRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {range === '7d' ? '7 Hari' : range === '14d' ? '14 Hari' : '30 Hari'}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3">
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Belum ada data untuk ditampilkan</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  interval={chartRange === '30d' ? 4 : chartRange === '14d' ? 1 : 0}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)}
                />
                <Tooltip
                  formatter={formatChartTooltip}
                  labelFormatter={(label: string) => label}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="pendapatan" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent notes */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">Nota Terbaru</h2>
        </div>
        <div className="p-3">
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Belum ada nota. Buat nota pertama!</p>
          ) : (
            <div className="space-y-2">
              {recent.map(inv => {
                const { grandTotal } = calcInvoiceTotals(inv);
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/50 p-3 hover:bg-accent/30 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{getBuyerDisplay(inv)} · {formatDate(inv.invoiceDate)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-sm">{formatCurrency(grandTotal)}</span>
                      <Badge variant="secondary" className={getStatusColor(inv.status)}>
                        {getStatusLabel(inv.status)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
