import { useMemo } from 'react';
import { useInvoiceStore } from '@/hooks/useInvoiceStore';
import { calcInvoiceTotals, Invoice } from '@/types/invoice';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { invoices } = useInvoiceStore();

  const stats = invoices.reduce(
    (acc, inv) => {
      const { grandTotal } = calcInvoiceTotals(inv);
      acc.total++;
      acc.revenue += inv.status === 'paid' ? grandTotal : 0;
      acc.outstanding += (inv.status === 'sent' || inv.status === 'overdue') ? grandTotal : 0;
      if (inv.status === 'overdue') acc.overdue++;
      return acc;
    },
    { total: 0, revenue: 0, outstanding: 0, overdue: 0 },
  );

  const recent = invoices.slice(0, 5);
  const mainCurrency = invoices[0]?.currency || 'IDR';

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { month: string; label: string; pendapatan: number; belumBayar: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      months.push({
        month: format(d, 'yyyy-MM'),
        label: format(d, 'MMM', { locale: idLocale }),
        pendapatan: 0,
        belumBayar: 0,
      });
    }
    invoices.forEach(inv => {
      const invMonth = inv.invoiceDate.substring(0, 7);
      const entry = months.find(m => m.month === invMonth);
      if (!entry) return;
      const { grandTotal } = calcInvoiceTotals(inv);
      if (inv.status === 'paid') entry.pendapatan += grandTotal;
      else if (inv.status === 'sent' || inv.status === 'overdue') entry.belumBayar += grandTotal;
    });
    return months;
  }, [invoices]);

  const chartConfig = {
    pendapatan: { label: 'Pendapatan', color: 'hsl(var(--primary))' },
    belumBayar: { label: 'Belum Bayar', color: 'hsl(var(--destructive))' },
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
        <Button size="sm" onClick={() => onNavigate('new')}>
          <Plus className="mr-1.5 h-4 w-4" /> Buat Invoice
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Invoice', value: stats.total, icon: FileText, color: 'from-primary/80 to-primary' },
          { label: 'Total Pendapatan', value: formatCurrency(stats.revenue, mainCurrency), icon: DollarSign, color: 'from-emerald-500/80 to-emerald-600' },
          { label: 'Belum Dibayar', value: formatCurrency(stats.outstanding, mainCurrency), icon: Clock, color: 'from-amber-500/80 to-amber-600' },
          { label: 'Jatuh Tempo', value: stats.overdue, icon: AlertTriangle, color: 'from-destructive/80 to-destructive', destructive: true },
        ].map(({ label, value, icon: Icon, color, destructive }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} opacity-80`} />
            {/* Subtle glow */}
            <div className={`absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
            <div className="relative flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className={`flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className={`relative text-xl md:text-2xl font-bold ${destructive ? 'text-destructive' : 'text-foreground'}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg shadow-primary/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="text-base font-semibold text-foreground">Pendapatan 6 Bulan Terakhir</h2>
        </div>
        <div className="p-4">
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <YAxis tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="pendapatan" fill="var(--color-pendapatan)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="belumBayar" fill="var(--color-belumBayar)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg shadow-primary/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="text-base font-semibold text-foreground">Invoice Terbaru</h2>
        </div>
        <div className="p-4">
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Belum ada invoice. Buat invoice pertama Anda!</p>
          ) : (
            <div className="space-y-2.5">
              {recent.map(inv => {
                const { grandTotal } = calcInvoiceTotals(inv);
                return (
                  <div key={inv.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm p-3 hover:bg-accent/30 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{inv.client.name || inv.client.company} · {formatDate(inv.invoiceDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{formatCurrency(grandTotal, inv.currency)}</span>
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
