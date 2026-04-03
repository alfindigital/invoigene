import { Currency } from '@/types/invoice';

export function formatCurrency(amount: number, currency?: Currency): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function generateInvoiceNumber(prefix: string, yearInNumber: boolean, nextNumber: number): string {
  const year = new Date().getFullYear();
  const num = String(nextNumber).padStart(4, '0');
  if (yearInNumber) {
    return `${prefix}-${year}-${num}`;
  }
  return `${prefix}-${num}`;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    sent: 'Terkirim',
    paid: 'Lunas',
    overdue: 'Jatuh Tempo',
    cancelled: 'Dibatalkan',
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  return map[status] || '';
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getBuyerDisplay(inv: { buyerName?: string; buyerPhone?: string; client?: { name: string; company: string } }): string {
  if (inv.buyerName) return inv.buyerName;
  if (inv.client?.name) return inv.client.name;
  if (inv.client?.company) return inv.client.company;
  return 'Umum';
}

export function buildWhatsAppNotaMessage(inv: { invoiceNumber: string; invoiceDate: string; buyerName?: string; currency: Currency; lineItems: { description: string; quantity: number; unitPrice: number }[] }, grandTotal: number, profile?: { companyName?: string; bankName?: string; bankAccountNumber?: string; bankAccountHolder?: string }): string {
  const lines = [
    `🧾 *Nota ${inv.invoiceNumber}*`,
    '',
    inv.buyerName ? `Pembeli: ${inv.buyerName}` : '',
    `Tanggal: ${formatDate(inv.invoiceDate)}`,
    '',
    '*Detail:*',
    ...inv.lineItems.map((item, i) => `${i + 1}. ${item.description} x${item.quantity} = ${formatCurrency(item.quantity * item.unitPrice)}`),
    '',
    `💰 *Total: ${formatCurrency(grandTotal)}*`,
  ].filter(Boolean);
  if (profile?.bankName) {
    lines.push('', '🏦 *Transfer ke:*', `${profile.bankName} ${profile.bankAccountNumber}`, `a/n ${profile.bankAccountHolder}`);
  }
  if (profile?.companyName) {
    lines.push('', `— ${profile.companyName}`);
  }
  return lines.join('\n');
}

export function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const url = cleaned
    ? `https://wa.me/${cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}
