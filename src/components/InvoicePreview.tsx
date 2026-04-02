import { useRef } from 'react';
import { Invoice, BusinessProfile, calcLineItemSubtotal, calcInvoiceTotals } from '@/types/invoice';
import { formatCurrency, formatDate, getStatusLabel, buildWhatsAppInvoiceMessage, openWhatsApp } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoicePreviewProps {
  invoice: Invoice;
  profile: BusinessProfile;
  onBack: () => void;
}

export default function InvoicePreview({ invoice, profile, onBack }: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const totals = calcInvoiceTotals(invoice);
  const bil = invoice.bilingualLabels;

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`${invoice.invoiceNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const qrData = `Invoice: ${invoice.invoiceNumber}\nTotal: ${formatCurrency(totals.grandTotal, invoice.currency)}\nBank: ${profile.bankName}\nRek: ${profile.bankAccountNumber}\nA/N: ${profile.bankAccountHolder}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Button>
        <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Cetak</Button>
        <Button size="sm" onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950" onClick={() => {
          const msg = buildWhatsAppInvoiceMessage(invoice, totals.grandTotal, profile);
          openWhatsApp(invoice.client.phone, msg);
        }}>
          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
        </Button>
      </div>

      <div ref={printRef} className="bg-white text-black mx-auto max-w-[210mm] p-4 sm:p-8 shadow-lg print:shadow-none print:p-0 overflow-x-auto" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', lineHeight: '1.5' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex items-center gap-3">
            {profile.logo && <img src={profile.logo} alt="Logo" className="h-12 w-12 sm:h-16 sm:w-16 object-contain" />}
            <div>
              <h1 className="text-base sm:text-xl font-bold">{profile.companyName || 'Nama Perusahaan'}</h1>
              <p className="text-gray-600 whitespace-pre-line text-xs">{profile.address}</p>
              {profile.phone && <p className="text-gray-600 text-xs">{profile.phone}</p>}
              {profile.email && <p className="text-gray-600 text-xs">{profile.email}</p>}
              {profile.taxId && <p className="text-gray-600 text-xs">NPWP: {profile.taxId}</p>}
            </div>
          </div>
          <div className="sm:text-right">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">INVOICE</h2>
            <p className="font-semibold text-sm sm:text-base">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Dates & Client */}
        <div className="flex justify-between mb-6">
          <div>
            <h3 className="font-semibold text-sm mb-1">{bil ? 'Kepada / Bill To' : 'Kepada'}</h3>
            <p className="font-semibold">{invoice.client.name}</p>
            {invoice.client.company && <p>{invoice.client.company}</p>}
            <p className="text-gray-600 whitespace-pre-line text-xs">{invoice.client.address}</p>
            {invoice.client.phone && <p className="text-xs text-gray-600">{invoice.client.phone}</p>}
            {invoice.client.email && <p className="text-xs text-gray-600">{invoice.client.email}</p>}
          </div>
          <div className="text-right text-xs space-y-1">
            <p><span className="text-gray-500">{bil ? 'Tanggal / Date:' : 'Tanggal:'}</span> {formatDate(invoice.invoiceDate)}</p>
            <p><span className="text-gray-500">{bil ? 'Jatuh Tempo / Due:' : 'Jatuh Tempo:'}</span> {formatDate(invoice.dueDate)}</p>
            <p><span className="text-gray-500">Status:</span> {getStatusLabel(invoice.status)}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 text-xs font-semibold" style={{ width: '30px' }}>No</th>
              <th className="text-left py-2 text-xs font-semibold">{bil ? 'Deskripsi / Description' : 'Deskripsi'}</th>
              <th className="text-right py-2 text-xs font-semibold" style={{ width: '50px' }}>{bil ? 'Qty' : 'Qty'}</th>
              <th className="text-center py-2 text-xs font-semibold" style={{ width: '50px' }}>{bil ? 'Satuan / Unit' : 'Satuan'}</th>
              <th className="text-right py-2 text-xs font-semibold" style={{ width: '100px' }}>{bil ? 'Harga / Price' : 'Harga'}</th>
              <th className="text-right py-2 text-xs font-semibold" style={{ width: '70px' }}>{bil ? 'Diskon / Disc.' : 'Diskon'}</th>
              <th className="text-right py-2 text-xs font-semibold" style={{ width: '110px' }}>{bil ? 'Jumlah / Amount' : 'Jumlah'}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 text-xs">{idx + 1}</td>
                <td className="py-2 text-xs">{item.description}</td>
                <td className="py-2 text-xs text-right">{item.quantity}</td>
                <td className="py-2 text-xs text-center">{item.unit}</td>
                <td className="py-2 text-xs text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="py-2 text-xs text-right">
                  {item.discountValue > 0 ? (item.discountType === 'percentage' ? `${item.discountValue}%` : formatCurrency(item.discountValue, invoice.currency)) : '-'}
                </td>
                <td className="py-2 text-xs text-right font-medium">{formatCurrency(calcLineItemSubtotal(item), invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1 text-xs">
            <div className="flex justify-between"><span>{bil ? 'Subtotal' : 'Subtotal'}</span><span>{formatCurrency(totals.subtotal, invoice.currency)}</span></div>
            {totals.additionalDiscount > 0 && (
              <div className="flex justify-between"><span>{bil ? 'Diskon / Discount' : 'Diskon'}</span><span>-{formatCurrency(totals.additionalDiscount, invoice.currency)}</span></div>
            )}
            {totals.taxRate > 0 && (
              <div className="flex justify-between"><span>{bil ? `Pajak / Tax (${totals.taxRate}%)` : `Pajak (${totals.taxRate}%)`}</span><span>{formatCurrency(totals.taxAmount, invoice.currency)}</span></div>
            )}
            {invoice.shippingCost > 0 && (
              <div className="flex justify-between"><span>{bil ? 'Pengiriman / Shipping' : 'Pengiriman'}</span><span>{formatCurrency(invoice.shippingCost, invoice.currency)}</span></div>
            )}
            <div className="flex justify-between border-t-2 border-gray-800 pt-2 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(totals.grandTotal, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {profile.bankName && (
          <div className="mb-6 flex gap-6 items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{bil ? 'Pembayaran / Payment' : 'Pembayaran'}</h3>
              <div className="text-xs space-y-0.5">
                <p>Bank: {profile.bankName}</p>
                <p>{bil ? 'No. Rekening / Account:' : 'No. Rekening:'} {profile.bankAccountNumber}</p>
                <p>{bil ? 'Atas Nama / Name:' : 'Atas Nama:'} {profile.bankAccountHolder}</p>
              </div>
            </div>
            <QRCodeSVG value={qrData} size={80} />
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-1">{bil ? 'Catatan / Notes' : 'Catatan'}</h3>
            <p className="text-xs text-gray-600 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t pt-4 mt-8">
          {invoice.footerText}
        </div>
      </div>
    </div>
  );
}
