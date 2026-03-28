

# Invoice Generator Mini App — Implementation Plan

## Overview
A fully functional, client-side Invoice Generator app in Bahasa Indonesia with bilingual invoice output, PDF export, and localStorage persistence. Professional, clean UI with dark mode support.

## Navigation Structure
Sidebar/tab navigation with 4 sections:
- **Dashboard** — Summary cards (total invoices, revenue, outstanding, overdue) + recent invoices
- **Buat Invoice** (New Invoice) — Full invoice creation form
- **Riwayat Invoice** (Invoice History) — Searchable/filterable list of all invoices
- **Pengaturan** (Settings) — Business profile, logo upload, bank details, invoice prefix config

## Core Pages & Features

### Dashboard
- Summary cards: total invoices, total revenue (by currency), outstanding amount, overdue count
- Quick-action buttons: New Invoice, View History
- Recent 5 invoices with status badges

### Invoice Form (Buat Invoice)
- **Sender**: Auto-filled from saved business profile
- **Client**: Dropdown to select saved client or "Tambah Klien Baru" with inline form
- **Invoice details**: Auto-generated number (customizable prefix, auto-increment), dates, due date presets (7/14/30/60 hari), payment terms, notes
- **Line items**: Add/remove/reorder rows with description, qty, unit (pcs/kg/pack/box/custom), unit price, discount (% or fixed), auto-calculated line subtotal
- **Item catalog**: Quick-add from saved items
- **Pricing summary**: Subtotal → additional discount → tax (PPN 11% / custom / none) → shipping → Grand Total
- **Currency selector**: IDR (default), USD, SGD with proper locale formatting
- **Status**: Draft/Sent/Paid/Overdue/Cancelled with badge
- **Actions**: Save, Preview PDF, Download PDF, Print, WhatsApp share, Duplicate

### Invoice History (Riwayat Invoice)
- Table/list of all invoices with: number, client, date, amount, status badge
- Search by client name or invoice number
- Filter by status and date range
- Actions per invoice: View, Edit, Duplicate, Delete (with confirmation dialog)
- Mark as Paid with payment date

### Settings (Pengaturan)
- Business profile form: company name, logo (base64 in localStorage), address, phone, email, Tax ID/NPWP
- Bank account details: bank name, account number, account holder
- Invoice number prefix format configuration
- Item catalog management (add/edit/delete frequently used items)
- Client management (edit/delete saved clients)

## PDF Output
Using jsPDF + html2canvas for professional A4 PDF:
- Header: Logo (left) + company info (right)
- Invoice number, dates, status
- Bill To: client details
- Line items table: No, Description, Qty, Unit, Unit Price, Discount, Amount
- Summary: Subtotal, Discount, Tax, Shipping, **Grand Total**
- Bank/payment details section
- Notes/terms section
- Footer with custom text
- QR code with payment details

## Data & Storage
- All data in localStorage: business profile, clients, invoices, item catalog, settings
- Custom hooks for CRUD operations on each entity

## UI/UX
- Clean, white, professional design using shadcn/ui components
- Dark mode toggle
- Responsive (desktop + mobile)
- Toast notifications for all actions
- Form validation with error highlighting
- Indonesian language UI with bilingual invoice output option
- Indonesian number formatting for IDR (Rp 1.500.000)

## Bonus Features
- WhatsApp share button with invoice summary message
- Duplicate invoice with auto-incremented number and new dates
- Multi-currency manual conversion rate input
- QR code on invoice (payment details)
- Item catalog for quick line item entry

