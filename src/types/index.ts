export interface Company {
  id: string;
  name: string;
  code: string;
}

export interface Salesman {
  id: string;
  name: string;
  code: string;
}

export interface Party {
  id: string;
  name: string;
  code: string;
  distributorId: string;
  city: string;
}

export interface Distributor {
  id: string;
  name: string;
  code: string;
  city: string;
}

export interface ItemGroup {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  itemGroupId: string;
  packSizeName: string; // e.g. "12 x 500ml", "24 x 100g", "6 x 1L"
  unitsPerPack: number; // e.g. 12, 24, 6
  unitName: string; // "Bottles", "Packets", "Units"
  standardRate: number; // rate per unit
}

export interface InvoiceItemLine {
  id: string;
  productId: string;
  packQty: number; // cartons/cases
  totalQty: number; // packQty * unitsPerPack
  rate: number; // rate per unit
  discount: number; // total discount on this line
  grossValue: number; // totalQty * rate
  netValue: number; // grossValue - discount
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  companyId: string;
  salesmanId: string;
  distributorId: string;
  partyId: string;
  freight: number; // recorded strictly once per invoice
  items: InvoiceItemLine[];
}

export interface FilterState {
  companyIds: string[]; // empty means all companies, or array of selected company IDs
  companyId?: string; // backwards compatibility / single select fallback
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  salesmenIds: string[];
  itemGroupIds: string[];
  distributorIds: string[];
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  column: string;
  direction: SortDirection;
}
