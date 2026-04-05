import { useLocalStorage } from './useLocalStorage';
import { Invoice, Client, BusinessProfile, CatalogItem, AppSettings, InvoiceTemplate } from '@/types/invoice';

const defaultProfile: BusinessProfile = {
  companyName: '', logo: '', address: '', phone: '', email: '', taxId: '',
  bankName: '', bankAccountNumber: '', bankAccountHolder: '',
};

const defaultSettings: AppSettings = {
  invoiceSettings: { prefix: 'INV', yearInNumber: true, nextNumber: 1 },
};

export function useInvoiceStore() {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('inv_invoices', []);
  const [clients, setClients] = useLocalStorage<Client[]>('inv_clients', []);
  const [profile, setProfile] = useLocalStorage<BusinessProfile>('inv_profile', defaultProfile);
  const [catalog, setCatalog] = useLocalStorage<CatalogItem[]>('inv_catalog', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('inv_settings', defaultSettings);

  const addInvoice = (inv: Invoice) => {
    setInvoices(prev => [inv, ...prev]);
    // auto-increment
    setSettings(prev => ({
      ...prev,
      invoiceSettings: { ...prev.invoiceSettings, nextNumber: prev.invoiceSettings.nextNumber + 1 },
    }));
  };

  const updateInvoice = (inv: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? inv : i));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const addClient = (c: Client) => setClients(prev => [...prev, c]);
  const updateClient = (c: Client) => setClients(prev => prev.map(i => i.id === c.id ? c : i));
  const deleteClient = (id: string) => setClients(prev => prev.filter(i => i.id !== id));

  const addCatalogItem = (item: CatalogItem) => setCatalog(prev => [...prev, item]);
  const updateCatalogItem = (item: CatalogItem) => setCatalog(prev => prev.map(i => i.id === item.id ? item : i));
  const deleteCatalogItem = (id: string) => setCatalog(prev => prev.filter(i => i.id !== id));

  return {
    invoices, addInvoice, updateInvoice, deleteInvoice,
    clients, addClient, updateClient, deleteClient,
    profile, setProfile,
    catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem,
    settings, setSettings,
  };
}
