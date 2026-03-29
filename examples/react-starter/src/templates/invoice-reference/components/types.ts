export interface InvoiceReferenceCompany {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  logoUrl?: string;
}

export interface InvoiceReferenceCustomer {
  name: string;
  contact: string;
  email: string;
  address: string;
}

export interface InvoiceReferenceLineItem {
  id: string;
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface InvoiceReferenceSection {
  title: string;
  description: string;
  notes?: string;
}

export interface InvoiceReferencePayment {
  iban: string;
  swift: string;
  bankName: string;
  instructions?: string;
}

export interface InvoiceReferenceWatermark {
  enabled: boolean;
  text: string;
}

export interface InvoiceReferenceBrand {
  accentColor?: string;
  supportEmail?: string;
}

export interface InvoiceReferencePayload {
  invoiceNumber: string;
  purchaseOrder?: string;
  issuedAt: string;
  dueAt: string;
  currency: string;
  company: InvoiceReferenceCompany;
  customer: InvoiceReferenceCustomer;
  items: InvoiceReferenceLineItem[];
  sections: InvoiceReferenceSection[];
  payment: InvoiceReferencePayment;
  notes?: string;
  watermark?: InvoiceReferenceWatermark;
  brand?: InvoiceReferenceBrand;
}
