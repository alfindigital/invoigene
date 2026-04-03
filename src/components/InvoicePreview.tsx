import { useRef } from 'react';
import { Invoice, BusinessProfile, calcLineItemSubtotal, calcInvoiceTotals } from '@/types/invoice';
import { formatCurrency, formatDate, getStatusLabel, getBuyerDisplay, buildWhatsAppNotaMessage, openWhatsApp } from '@/lib/formatters';
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
  const buyer = getBuyerDisplay(invoice);

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

  const qrData = profile.bankName
    ? `Bank: ${profile.bankName}\nRek: ${profile.bankAccountNumber}\nA/N: ${profile.bankAccountHolder}\nTotal: ${formatCurrency(totals.grandTotal)}`
    : `Nota: ${invoice.invoiceNumber}\nTotal: ${formatCurrency(totals.grandTotal)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali</Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Cetak</Button>
        <Button size="sm" onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button>
        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950" onClick={() => {
          const msg = buildWhatsAppNotaMessage(invoice, totals.grandTotal, profile);
          openWhatsApp(invoice.buyerPhone || '', msg);
        }}>
          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
        </Button>
      </div>

      <div ref={printRef} className="bg-white text-black mx-auto max-w-[210mm] p-4 sm:p-6 shadow-lg print:shadow-none print:p-0" style={{ fontFamily: 'system-ui, sans-serif', fontSize: '12px', lineHeight: '1.5' }}>
        {/* Header */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex items-center gap-3">
            {profile.logo && <img src={profile.logo} alt="Logo" className="h-12 w-12 object-contain" />}
            <div>
              <h1 className="text-base font-bold">{profile.companyName || 'Nama Usaha'}</h1>
              {profile.address && <p className="text-gray-600 text-xs">{profile.address}</p>}
              {profile.phone && <p className="text-gray-600 text-xs">{profile.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-800">NOTA</h2>
            <p className="font-semibold text-sm">{invoice.invoiceNumber}</p>
            <p className="text-xs text-gray-500">{formatDate(invoice.invoiceDate)}</p>
          </div>
        </div>

        {/* Buyer */}
        {buyer !== 'Umum' && (
          <div className="mb-4 text-sm">
            <span className="text-gray-500">Pembeli:</span> <span className="font-medium">{buyer}</span>
            {invoice.buyerPhone && <span className="text-gray-500 ml-2">({invoice.buyerPhone})</span>}
          </div>
        )}

        {/* Items */}
        <table className="w-full mb-4" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-1.5 text-xs font-semibold" style={{ width: '30px' }}>No</th>
              <th className="text-left py-1.5 text-xs font-semibold">Item</th>
              <th className="text-right py-1.5 text-xs font-semibold" style={{ width: '40px' }}>Qty</th>
              <th className="text-right py-1.5 text-xs font-semibold" style={{ width: '90px' }}>Harga</th>
              <th className="text-right py-1.5 text-xs font-semibold" style={{ width: '100px' }}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-1.5 text-xs">{idx + 1}</td>
                <td className="py-1.5 text-xs">{item.description}</td>
                <td className="py-1.5 text-xs text-right">{item.quantity}</td>
                <td className="py-1.5 text-xs text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-1.5 text-xs text-right font-medium">{formatCurrency(calcLineItemSubtotal(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-4">
          <div className="w-56 space-y-0.5 text-xs">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
            {totals.additionalDiscount > 0 && (
              <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(totals.additionalDiscount)}</span></div>
            )}
            {totals.taxRate > 0 && (
              <div className="flex justify-between"><span>Pajak ({totals.taxRate}%)</span><span>{formatCurrency(totals.taxAmount)}</span></div>
            )}
            {(invoice.shippingCost || 0) > 0 && (
              <div className="flex justify-between"><span>Ongkir</span><span>{formatCurrency(invoice.shippingCost)}</span></div>
            )}
            <div className="flex justify-between border-t-2 border-gray-800 pt-1.5 text-sm font-bold">
              <span>Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Bank + QR */}
        {profile.bankName && (
          <div className="flex gap-4 items-start mb-4">
            <div className="flex-1 text-xs">
              <p className="font-semibold mb-0.5">Transfer ke:</p>
              <p>{profile.bankName} {profile.bankAccountNumber}</p>
              <p>a/n {profile.bankAccountHolder}</p>
            </div>
            <QRCodeSVG value={qrData} size={64} />
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <p className="text-xs text-gray-500 mb-2">{invoice.notes}</p>
        )}

        <div className="text-center text-[10px] text-gray-400 border-t pt-3 mt-6">
          Terima kasih atas pembeliannya! 🙏
        </div>
      </div>
    </div>
  );
}
