import { forwardRef } from 'react';
import { Invoice, BusinessProfile, calcLineItemSubtotal, calcInvoiceTotals } from '@/types/invoice';
import { formatCurrency, formatDate, getBuyerDisplay } from '@/lib/formatters';

type PaperWidth = '58mm' | '80mm';

interface ThermalReceiptProps {
  invoice: Invoice;
  profile: BusinessProfile;
  paperWidth: PaperWidth;
}

const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ invoice, profile, paperWidth }, ref) => {
    const totals = calcInvoiceTotals(invoice);
    const buyer = getBuyerDisplay(invoice);
    const is58 = paperWidth === '58mm';

    // 58mm ≈ 48mm printable, 80mm ≈ 72mm printable
    const containerWidth = is58 ? '48mm' : '72mm';
    const fontSize = is58 ? '8px' : '9px';
    const headerSize = is58 ? '10px' : '12px';
    const separatorChar = is58 ? '-' : '=';
    const separatorLen = is58 ? 32 : 48;
    const separator = separatorChar.repeat(separatorLen);

    return (
      <div
        ref={ref}
        style={{
          width: containerWidth,
          fontFamily: "'Courier New', 'Consolas', monospace",
          fontSize,
          lineHeight: '1.4',
          color: '#000',
          backgroundColor: '#fff',
          padding: is58 ? '2mm' : '3mm',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
          <div style={{ fontSize: headerSize, fontWeight: 'bold' }}>
            {profile.companyName || 'NAMA USAHA'}
          </div>
          {profile.address && (
            <div style={{ fontSize: is58 ? '7px' : '8px', marginTop: '1px' }}>
              {profile.address}
            </div>
          )}
          {profile.phone && (
            <div style={{ fontSize: is58 ? '7px' : '8px' }}>
              {profile.phone}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', letterSpacing: '1px', margin: '1mm 0' }}>
          {separator}
        </div>

        {/* Invoice info */}
        <div style={{ marginBottom: '1mm' }}>
          <div>No: {invoice.invoiceNumber}</div>
          <div>Tgl: {formatDate(invoice.invoiceDate)}</div>
          {buyer !== 'Umum' && <div>Pembeli: {buyer}</div>}
        </div>

        <div style={{ letterSpacing: '1px' }}>{separator}</div>

        {/* Items */}
        <div style={{ margin: '1mm 0' }}>
          {invoice.lineItems.map((item) => {
            const subtotal = calcLineItemSubtotal(item);
            return (
              <div key={item.id} style={{ marginBottom: '1mm' }}>
                <div style={{ fontWeight: 'bold' }}>{item.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ letterSpacing: '1px' }}>{separator}</div>

        {/* Summary */}
        <div style={{ margin: '1mm 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.additionalDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Diskon</span>
              <span>-{formatCurrency(totals.additionalDiscount)}</span>
            </div>
          )}
          {totals.taxRate > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pajak ({totals.taxRate}%)</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
          )}
          {(invoice.shippingCost || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ongkir</span>
              <span>{formatCurrency(invoice.shippingCost)}</span>
            </div>
          )}
        </div>

        <div style={{ letterSpacing: '1px', fontWeight: 'bold' }}>{separator}</div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: is58 ? '10px' : '12px',
            margin: '1mm 0',
          }}
        >
          <span>TOTAL</span>
          <span>{formatCurrency(totals.grandTotal)}</span>
        </div>

        <div style={{ letterSpacing: '1px', fontWeight: 'bold' }}>{separator}</div>

        {/* Bank info */}
        {profile.bankName && (
          <div style={{ margin: '2mm 0 1mm', textAlign: 'center', fontSize: is58 ? '7px' : '8px' }}>
            <div>Transfer ke:</div>
            <div style={{ fontWeight: 'bold' }}>{profile.bankName} {profile.bankAccountNumber}</div>
            <div>a/n {profile.bankAccountHolder}</div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ margin: '1mm 0', fontSize: is58 ? '7px' : '8px', textAlign: 'center' }}>
            {invoice.notes}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '3mm',
            fontSize: is58 ? '7px' : '8px',
          }}
        >
          <div>Terima kasih!</div>
          <div style={{ marginTop: '1mm', fontSize: is58 ? '6px' : '7px', color: '#666' }}>
            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
export type { PaperWidth };
