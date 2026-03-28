export type Currency = 'IDR' | 'USD' | 'SGD';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type DiscountType = 'percentage' | 'fixed';

export interface BusinessProfile {
  companyName: string;
  logo: string; // base64
  address: string;
  phone: string;
  email: string;
  taxId: string; // NPWP
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  address: string;
  phone: string;
  email: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
}

export interface CatalogItem {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: Currency;
  invoiceDate: string; // ISO date string
  dueDate: string;
  paymentTerms: string;
  notes: string;
  clientId: string;
  client: Client;
  lineItems: LineItem[];
  additionalDiscountType: DiscountType;
  additionalDiscountValue: number;
  taxType: 'ppn11' | 'custom' | 'none';
  customTaxRate: number;
  shippingCost: number;
  paidDate?: string;
  bilingualLabels: boolean;
  footerText: string;
}

export interface InvoiceSettings {
  prefix: string; // e.g. "INV"
  yearInNumber: boolean;
  nextNumber: number;
}

export interface AppSettings {
  invoiceSettings: InvoiceSettings;
}

// Calculation helpers
export function calcLineItemSubtotal(item: LineItem): number {
  const gross = item.quantity * item.unitPrice;
  if (item.discountType === 'percentage') {
    return gross * (1 - item.discountValue / 100);
  }
  return Math.max(0, gross - item.discountValue);
}

export function calcInvoiceTotals(invoice: Pick<Invoice, 'lineItems' | 'additionalDiscountType' | 'additionalDiscountValue' | 'taxType' | 'customTaxRate' | 'shippingCost'>) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + calcLineItemSubtotal(item), 0);

  let additionalDiscount = 0;
  if (invoice.additionalDiscountType === 'percentage') {
    additionalDiscount = subtotal * (invoice.additionalDiscountValue / 100);
  } else {
    additionalDiscount = invoice.additionalDiscountValue;
  }

  const afterDiscount = Math.max(0, subtotal - additionalDiscount);

  let taxRate = 0;
  if (invoice.taxType === 'ppn11') taxRate = 11;
  else if (invoice.taxType === 'custom') taxRate = invoice.customTaxRate;

  const taxAmount = afterDiscount * (taxRate / 100);
  const grandTotal = afterDiscount + taxAmount + (invoice.shippingCost || 0);

  return { subtotal, additionalDiscount, afterDiscount, taxRate, taxAmount, grandTotal };
}
