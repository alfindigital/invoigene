import { Invoice, calcInvoiceTotals } from '@/types/invoice';
import { formatCurrency, formatDate, getBuyerDisplay, getStatusLabel } from './formatters';

interface ReportRow {
  invoiceNumber: string;
  date: string;
  buyer: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  grandTotal: number;
}

function buildRows(invoices: Invoice[]): ReportRow[] {
  return invoices.map(inv => {
    const t = calcInvoiceTotals(inv);
    return {
      invoiceNumber: inv.invoiceNumber,
      date: inv.invoiceDate,
      buyer: getBuyerDisplay(inv),
      status: getStatusLabel(inv.status),
      subtotal: t.subtotal,
      discount: t.additionalDiscount,
      tax: t.taxAmount,
      shipping: inv.shippingCost || 0,
      grandTotal: t.grandTotal,
    };
  });
}

export function exportCSV(invoices: Invoice[], filename?: string) {
  const rows = buildRows(invoices);
  const header = ['No Nota', 'Tanggal', 'Pembeli', 'Status', 'Subtotal', 'Diskon', 'Pajak', 'Ongkir', 'Grand Total'];
  const csvLines = [
    header.join(','),
    ...rows.map(r => [
      `"${r.invoiceNumber}"`,
      r.date,
      `"${r.buyer}"`,
      `"${r.status}"`,
      r.subtotal,
      r.discount,
      r.tax,
      r.shipping,
      r.grandTotal,
    ].join(',')),
  ];

  const totalRevenue = rows.reduce((s, r) => s + r.grandTotal, 0);
  csvLines.push('');
  csvLines.push(`,,,,,,,,${totalRevenue}`);

  const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename || `laporan-penjualan-${new Date().toISOString().split('T')[0]}.csv`);
}

export async function exportPDF(invoices: Invoice[], companyName?: string, filename?: string) {
  const rows = buildRows(invoices);
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 10;
  const marginR = 10;
  let y = 15;

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName || 'Laporan Penjualan', marginL, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak: ${formatDate(new Date().toISOString().split('T')[0])} · ${rows.length} nota`, marginL, y);
  y += 8;

  // Table header
  const cols = [
    { label: 'No Nota', w: 35 },
    { label: 'Tanggal', w: 25 },
    { label: 'Pembeli', w: 45 },
    { label: 'Status', w: 22 },
    { label: 'Subtotal', w: 30 },
    { label: 'Diskon', w: 25 },
    { label: 'Pajak', w: 25 },
    { label: 'Ongkir', w: 25 },
    { label: 'Total', w: 35 },
  ];

  const drawHeader = () => {
    doc.setFillColor(37, 99, 235); // primary blue
    doc.rect(marginL, y - 4, pageW - marginL - marginR, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let x = marginL + 2;
    cols.forEach(col => {
      doc.text(col.label, x, y);
      x += col.w;
    });
    doc.setTextColor(0, 0, 0);
    y += 6;
  };

  drawHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  let totalRevenue = 0;

  rows.forEach((r, i) => {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 15;
      drawHeader();
    }

    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(marginL, y - 3.5, pageW - marginL - marginR, 5.5, 'F');
    }

    let x = marginL + 2;
    doc.text(r.invoiceNumber, x, y); x += cols[0].w;
    doc.text(formatDate(r.date), x, y); x += cols[1].w;
    doc.text(r.buyer.slice(0, 25), x, y); x += cols[2].w;
    doc.text(r.status, x, y); x += cols[3].w;
    doc.text(formatCurrency(r.subtotal), x, y); x += cols[4].w;
    doc.text(formatCurrency(r.discount), x, y); x += cols[5].w;
    doc.text(formatCurrency(r.tax), x, y); x += cols[6].w;
    doc.text(formatCurrency(r.shipping), x, y); x += cols[7].w;
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(r.grandTotal), x, y);
    doc.setFont('helvetica', 'normal');

    totalRevenue += r.grandTotal;
    y += 5.5;
  });

  // Total row
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Pendapatan: ${formatCurrency(totalRevenue)}`, marginL + 2, y);

  doc.save(filename || `laporan-penjualan-${new Date().toISOString().split('T')[0]}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
