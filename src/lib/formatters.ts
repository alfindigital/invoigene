import { Currency } from '@/types/invoice';

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'IDR') {
    const formatted = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
  }
  const symbol = currency === 'USD' ? '$' : 'S$';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export function buildWhatsAppInvoiceMessage(inv: { invoiceNumber: string; invoiceDate: string; dueDate: string; status: string; currency: Currency; client: { name: string; company: string; phone: string } }, grandTotal: number, profile?: { companyName?: string; bankName?: string; bankAccountNumber?: string; bankAccountHolder?: string }): string {
  const lines = [
    `📄 *Invoice ${inv.invoiceNumber}*`,
    '',
    `Kepada: ${inv.client.name}${inv.client.company ? ` (${inv.client.company})` : ''}`,
    `Tanggal: ${formatDate(inv.invoiceDate)}`,
    `Jatuh Tempo: ${formatDate(inv.dueDate)}`,
    `Status: ${getStatusLabel(inv.status)}`,
    '',
    `💰 *Total: ${formatCurrency(grandTotal, inv.currency)}*`,
  ];
  if (profile?.bankName) {
    lines.push('', '🏦 *Pembayaran:*', `Bank: ${profile.bankName}`, `No. Rek: ${profile.bankAccountNumber}`, `A/N: ${profile.bankAccountHolder}`);
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
