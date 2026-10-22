import {
  Invoice,
  FilterState,
  InvoiceItemLine,
  Product,
} from '../types';
import {
  INVOICES,
  PRODUCT_MAP,
  ITEM_GROUP_MAP,
  SALESMAN_MAP,
  DISTRIBUTOR_MAP,
  PARTY_MAP,
} from '../data/dummyData';

export interface FilteredLineItem {
  invoiceId: string;
  invoiceNo: string;
  date: string;
  companyId: string;
  salesmanId: string;
  distributorId: string;
  partyId: string;
  freight: number;
  lineId: string;
  productId: string;
  product: Product;
  itemGroupId: string;
  packQty: number;
  totalQty: number;
  rate: number;
  discount: number;
  grossValue: number;
  netValue: number;
}

/**
 * Filter invoices and line items according to applied filter state.
 * @param ignoreItemGroup if true (for S5 freight report), all item lines are included
 */
export function getFilteredRecords(filters: FilterState, ignoreItemGroup: boolean = false) {
  // 1. Filter invoices by company, date range, salesman, distributor
  const matchingInvoices = INVOICES.filter((inv) => {
    // Company multi-select (OR logic: if specific companies selected, match any)
    if (filters.companyIds && filters.companyIds.length > 0) {
      if (!filters.companyIds.includes(inv.companyId)) return false;
    } else if (filters.companyId && filters.companyId !== 'all') {
      if (inv.companyId !== filters.companyId) return false;
    }
    // Date range filter
    if (filters.dateFrom && inv.date < filters.dateFrom) return false;
    if (filters.dateTo && inv.date > filters.dateTo) return false;

    // Salesman multi-select (OR logic)
    if (filters.salesmenIds && filters.salesmenIds.length > 0) {
      if (!filters.salesmenIds.includes(inv.salesmanId)) return false;
    }

    // Distributor multi-select (OR logic)
    if (filters.distributorIds && filters.distributorIds.length > 0) {
      if (!filters.distributorIds.includes(inv.distributorId)) return false;
    }

    return true;
  });

  // 2. Extract line items, applying itemGroup filter unless ignored
  const filteredLines: FilteredLineItem[] = [];
  const validInvoiceIds = new Set<string>();

  for (const inv of matchingInvoices) {
    let invoiceHasValidLine = false;

    for (const item of inv.items) {
      const prod = PRODUCT_MAP.get(item.productId);
      if (!prod) continue;

      if (!ignoreItemGroup && filters.itemGroupIds && filters.itemGroupIds.length > 0) {
        if (!filters.itemGroupIds.includes(prod.itemGroupId)) {
          continue; // skip item not in selected item group
        }
      }

      invoiceHasValidLine = true;
      filteredLines.push({
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        companyId: inv.companyId,
        salesmanId: inv.salesmanId,
        distributorId: inv.distributorId,
        partyId: inv.partyId,
        freight: inv.freight,
        lineId: item.id,
        productId: item.productId,
        product: prod,
        itemGroupId: prod.itemGroupId,
        packQty: item.packQty,
        totalQty: item.totalQty,
        rate: item.rate,
        discount: item.discount,
        grossValue: item.grossValue,
        netValue: item.netValue,
      });
    }

    if (invoiceHasValidLine) {
      validInvoiceIds.add(inv.id);
    }
  }

  // Active invoices that have matching items
  const activeInvoices = matchingInvoices.filter((inv) => validInvoiceIds.has(inv.id));

  return {
    invoices: activeInvoices,
    lineItems: filteredLines,
  };
}

// -------------------------------------------------------------
// S1: Total Sales by Date (Item & Value)
// -------------------------------------------------------------
export interface S1SummaryRow {
  productId: string;
  itemCode: string;
  itemName: string;
  itemGroupName: string;
  packSize: string;
  packQty: number;
  totalQty: number;
  value: number;
  percentOfTotal: number;
}

export function computeS1Summary(lines: FilteredLineItem[]): {
  rows: S1SummaryRow[];
  grandTotal: { packQty: number; totalQty: number; value: number; percentOfTotal: number };
} {
  const map = new Map<string, { packQty: number; totalQty: number; value: number; prod: Product }>();

  let totalValue = 0;
  let totalPackQty = 0;
  let grandTotalQty = 0;

  for (const line of lines) {
    const existing = map.get(line.productId) || {
      packQty: 0,
      totalQty: 0,
      value: 0,
      prod: line.product,
    };
    existing.packQty += line.packQty;
    existing.totalQty += line.totalQty;
    existing.value += line.netValue;
    map.set(line.productId, existing);

    totalValue += line.netValue;
    totalPackQty += line.packQty;
    grandTotalQty += line.totalQty;
  }

  const rows: S1SummaryRow[] = [];
  const roundedGrandVal = Math.round(totalValue * 100) / 100;

  for (const [prodId, data] of map.entries()) {
    const group = ITEM_GROUP_MAP.get(data.prod.itemGroupId);
    const rowVal = Math.round(data.value * 100) / 100;
    const pct = roundedGrandVal > 0 ? Math.round(((rowVal / roundedGrandVal) * 100) * 100) / 100 : 0;
    rows.push({
      productId: prodId,
      itemCode: data.prod.code,
      itemName: data.prod.name,
      itemGroupName: group ? group.name : 'Unknown',
      packSize: data.prod.packSizeName,
      packQty: data.packQty,
      totalQty: data.totalQty,
      value: rowVal,
      percentOfTotal: pct,
    });
  }

  // Default sort by Value descending
  rows.sort((a, b) => b.value - a.value);

  return {
    rows,
    grandTotal: {
      packQty: totalPackQty,
      totalQty: grandTotalQty,
      value: roundedGrandVal,
      percentOfTotal: roundedGrandVal > 0 ? 100 : 0,
    },
  };
}

// -------------------------------------------------------------
// S2: Salesman and Party Sales Report
// -------------------------------------------------------------
export interface S2SalesmanSummaryRow {
  salesmanId: string;
  salesmanCode: string;
  salesmanName: string;
  partyCount: number;
  invoiceCount: number;
  totalQty: number;
  netValue: number;
  percentOfTotal: number;
}

export function computeS2SalesmanSummary(lines: FilteredLineItem[]): {
  rows: S2SalesmanSummaryRow[];
  grandTotal: { partyCount: number; invoiceCount: number; totalQty: number; netValue: number; percentOfTotal: number };
} {
  const smMap = new Map<
    string,
    {
      parties: Set<string>;
      invoices: Set<string>;
      totalQty: number;
      netValue: number;
    }
  >();

  let grandValue = 0;
  let grandTotalQty = 0;
  const allParties = new Set<string>();
  const allInvoices = new Set<string>();

  for (const line of lines) {
    let smData = smMap.get(line.salesmanId);
    if (!smData) {
      smData = {
        parties: new Set(),
        invoices: new Set(),
        totalQty: 0,
        netValue: 0,
      };
      smMap.set(line.salesmanId, smData);
    }
    smData.parties.add(line.partyId);
    smData.invoices.add(line.invoiceId);
    smData.totalQty += line.totalQty;
    smData.netValue += line.netValue;

    allParties.add(line.partyId);
    allInvoices.add(line.invoiceId);
    grandValue += line.netValue;
    grandTotalQty += line.totalQty;
  }

  const rows: S2SalesmanSummaryRow[] = [];
  const roundedGrandVal = Math.round(grandValue * 100) / 100;

  for (const [smId, data] of smMap.entries()) {
    const sm = SALESMAN_MAP.get(smId);
    const rowNetVal = Math.round(data.netValue * 100) / 100;
    const pct = roundedGrandVal > 0 ? Math.round(((rowNetVal / roundedGrandVal) * 100) * 100) / 100 : 0;
    rows.push({
      salesmanId: smId,
      salesmanCode: sm ? sm.code : '',
      salesmanName: sm ? sm.name : 'Unknown Salesman',
      partyCount: data.parties.size,
      invoiceCount: data.invoices.size,
      totalQty: data.totalQty,
      netValue: rowNetVal,
      percentOfTotal: pct,
    });
  }

  rows.sort((a, b) => b.netValue - a.netValue);

  return {
    rows,
    grandTotal: {
      partyCount: allParties.size,
      invoiceCount: allInvoices.size,
      totalQty: grandTotalQty,
      netValue: roundedGrandVal,
      percentOfTotal: roundedGrandVal > 0 ? 100 : 0,
    },
  };
}

export interface S2SalesmanPartyGroup {
  salesmanId: string;
  salesmanName: string;
  parties: {
    partyId: string;
    partyName: string;
    invoiceCount: number;
    totalQty: number;
    netValue: number;
  }[];
  subtotal: {
    invoiceCount: number;
    totalQty: number;
    netValue: number;
  };
}

export function computeS2SalesmanPartySummary(
  lines: FilteredLineItem[],
  selectedSalesmanId?: string
): {
  groups: S2SalesmanPartyGroup[];
  grandTotal: { invoiceCount: number; totalQty: number; netValue: number };
} {
  const filtered = selectedSalesmanId
    ? lines.filter((l) => l.salesmanId === selectedSalesmanId)
    : lines;

  const smMap = new Map<
    string,
    Map<string, { invoices: Set<string>; totalQty: number; netValue: number }>
  >();

  const allInvoices = new Set<string>();
  let grandTotalQty = 0;
  let grandNetValue = 0;

  for (const line of filtered) {
    let partyMap = smMap.get(line.salesmanId);
    if (!partyMap) {
      partyMap = new Map();
      smMap.set(line.salesmanId, partyMap);
    }

    let pData = partyMap.get(line.partyId);
    if (!pData) {
      pData = { invoices: new Set(), totalQty: 0, netValue: 0 };
      partyMap.set(line.partyId, pData);
    }

    pData.invoices.add(line.invoiceId);
    pData.totalQty += line.totalQty;
    pData.netValue += line.netValue;

    allInvoices.add(line.invoiceId);
    grandTotalQty += line.totalQty;
    grandNetValue += line.netValue;
  }

  const groups: S2SalesmanPartyGroup[] = [];

  for (const [smId, partyMap] of smMap.entries()) {
    const sm = SALESMAN_MAP.get(smId);
    const smInvoices = new Set<string>();
    let smTotalQty = 0;
    let smNetValue = 0;

    const partyRows: {
      partyId: string;
      partyName: string;
      invoiceCount: number;
      totalQty: number;
      netValue: number;
    }[] = [];

    for (const [pId, pData] of partyMap.entries()) {
      const party = PARTY_MAP.get(pId);
      for (const inv of pData.invoices) {
        smInvoices.add(inv);
      }
      smTotalQty += pData.totalQty;
      smNetValue += pData.netValue;

      partyRows.push({
        partyId: pId,
        partyName: party ? party.name : 'Unknown Party',
        invoiceCount: pData.invoices.size,
        totalQty: pData.totalQty,
        netValue: Math.round(pData.netValue * 100) / 100,
      });
    }

    partyRows.sort((a, b) => b.netValue - a.netValue);

    groups.push({
      salesmanId: smId,
      salesmanName: sm ? sm.name : 'Unknown Salesman',
      parties: partyRows,
      subtotal: {
        invoiceCount: smInvoices.size,
        totalQty: smTotalQty,
        netValue: Math.round(smNetValue * 100) / 100,
      },
    });
  }

  groups.sort((a, b) => b.subtotal.netValue - a.subtotal.netValue);

  return {
    groups,
    grandTotal: {
      invoiceCount: allInvoices.size,
      totalQty: grandTotalQty,
      netValue: Math.round(grandNetValue * 100) / 100,
    },
  };
}

// -------------------------------------------------------------
// S3: Item-Wise Sales (Grouped by Item Group with Subtotals)
// -------------------------------------------------------------
export interface S3ItemRow {
  productId: string;
  itemCode: string;
  itemName: string;
  itemGroupId: string;
  itemGroupName: string;
  packSize: string;
  packQty: number;
  totalQty: number;
  averageRate: number; // weighted: value / totalQty
  value: number;
  percentOfTotal: number;
}

export interface S3Group {
  itemGroupId: string;
  itemGroupName: string;
  items: S3ItemRow[];
  subtotal: {
    packQty: number;
    totalQty: number;
    averageRate: number;
    value: number;
    percentOfTotal: number;
  };
}

export function computeS3Summary(lines: FilteredLineItem[]): {
  groups: S3Group[];
  grandTotal: {
    packQty: number;
    totalQty: number;
    averageRate: number;
    value: number;
    percentOfTotal: number;
  };
} {
  let grandPackQty = 0;
  let grandTotalQty = 0;
  let grandValue = 0;

  // Group by itemGroupId -> productId -> totals
  const groupMap = new Map<
    string,
    Map<string, { packQty: number; totalQty: number; value: number; prod: Product }>
  >();

  for (const line of lines) {
    grandPackQty += line.packQty;
    grandTotalQty += line.totalQty;
    grandValue += line.netValue;

    let itemMap = groupMap.get(line.itemGroupId);
    if (!itemMap) {
      itemMap = new Map();
      groupMap.set(line.itemGroupId, itemMap);
    }

    const existing = itemMap.get(line.productId) || {
      packQty: 0,
      totalQty: 0,
      value: 0,
      prod: line.product,
    };
    existing.packQty += line.packQty;
    existing.totalQty += line.totalQty;
    existing.value += line.netValue;
    itemMap.set(line.productId, existing);
  }

  const groups: S3Group[] = [];

  for (const [grpId, itemMap] of groupMap.entries()) {
    const grp = ITEM_GROUP_MAP.get(grpId);
    const grpName = grp ? grp.name : 'Unknown Group';

    let grpPackQty = 0;
    let grpTotalQty = 0;
    let grpValue = 0;

    const items: S3ItemRow[] = [];
    const roundedGrandVal = Math.round(grandValue * 100) / 100;

    for (const [prodId, data] of itemMap.entries()) {
      grpPackQty += data.packQty;
      grpTotalQty += data.totalQty;
      grpValue += data.value;

      const rowVal = Math.round(data.value * 100) / 100;
      const avgRate = data.totalQty !== 0 ? Math.round((rowVal / data.totalQty) * 100) / 100 : 0;
      const pct = roundedGrandVal > 0 ? Math.round(((rowVal / roundedGrandVal) * 100) * 100) / 100 : 0;

      items.push({
        productId: prodId,
        itemCode: data.prod.code,
        itemName: data.prod.name,
        itemGroupId: grpId,
        itemGroupName: grpName,
        packSize: data.prod.packSizeName,
        packQty: data.packQty,
        totalQty: data.totalQty,
        averageRate: avgRate,
        value: rowVal,
        percentOfTotal: pct,
      });
    }

    items.sort((a, b) => b.value - a.value);

    const roundedGrpVal = Math.round(grpValue * 100) / 100;
    const grpAvgRate = grpTotalQty !== 0 ? Math.round((roundedGrpVal / grpTotalQty) * 100) / 100 : 0;
    const grpPct = roundedGrandVal > 0 ? Math.round(((roundedGrpVal / roundedGrandVal) * 100) * 100) / 100 : 0;

    groups.push({
      itemGroupId: grpId,
      itemGroupName: grpName,
      items,
      subtotal: {
        packQty: grpPackQty,
        totalQty: grpTotalQty,
        averageRate: grpAvgRate,
        value: roundedGrpVal,
        percentOfTotal: grpPct,
      },
    });
  }

  groups.sort((a, b) => b.subtotal.value - a.subtotal.value);

  const roundedGrandVal = Math.round(grandValue * 100) / 100;
  const grandAvgRate = grandTotalQty !== 0 ? Math.round((roundedGrandVal / grandTotalQty) * 100) / 100 : 0;

  return {
    groups,
    grandTotal: {
      packQty: grandPackQty,
      totalQty: grandTotalQty,
      averageRate: grandAvgRate,
      value: roundedGrandVal,
      percentOfTotal: roundedGrandVal > 0 ? 100 : 0,
    },
  };
}

// -------------------------------------------------------------
// S4: Distributor-Wise Sales
// -------------------------------------------------------------
export interface S4SummaryRow {
  distributorId: string;
  distributorName: string;
  distributorCode: string;
  salesmenNames: string;
  invoiceCount: number;
  packQty: number;
  totalQty: number;
  value: number;
  percentOfTotal: number;
  lastSaleDate: string;
}

export function computeS4Summary(lines: FilteredLineItem[]): {
  rows: S4SummaryRow[];
  grandTotal: {
    invoiceCount: number;
    packQty: number;
    totalQty: number;
    value: number;
    percentOfTotal: number;
  };
} {
  const distMap = new Map<
    string,
    {
      invoices: Set<string>;
      salesmen: Set<string>;
      packQty: number;
      totalQty: number;
      value: number;
      lastDate: string;
    }
  >();

  const allInvoices = new Set<string>();
  let grandPackQty = 0;
  let grandTotalQty = 0;
  let grandValue = 0;

  for (const line of lines) {
    let data = distMap.get(line.distributorId);
    if (!data) {
      data = {
        invoices: new Set(),
        salesmen: new Set(),
        packQty: 0,
        totalQty: 0,
        value: 0,
        lastDate: line.date,
      };
      distMap.set(line.distributorId, data);
    }

    data.invoices.add(line.invoiceId);
    data.salesmen.add(line.salesmanId);
    data.packQty += line.packQty;
    data.totalQty += line.totalQty;
    data.value += line.netValue;
    if (line.date > data.lastDate) {
      data.lastDate = line.date;
    }

    allInvoices.add(line.invoiceId);
    grandPackQty += line.packQty;
    grandTotalQty += line.totalQty;
    grandValue += line.netValue;
  }

  const rows: S4SummaryRow[] = [];
  const roundedGrandVal = Math.round(grandValue * 100) / 100;

  for (const [distId, data] of distMap.entries()) {
    const dist = DISTRIBUTOR_MAP.get(distId);
    const smNames = Array.from(data.salesmen)
      .map((id) => SALESMAN_MAP.get(id)?.name || id)
      .join(', ');

    const rowVal = Math.round(data.value * 100) / 100;
    const pct = roundedGrandVal > 0 ? Math.round(((rowVal / roundedGrandVal) * 100) * 100) / 100 : 0;

    rows.push({
      distributorId: distId,
      distributorName: dist ? dist.name : 'Unknown Distributor',
      distributorCode: dist ? dist.code : '',
      salesmenNames: smNames,
      invoiceCount: data.invoices.size,
      packQty: data.packQty,
      totalQty: data.totalQty,
      value: rowVal,
      percentOfTotal: pct,
      lastSaleDate: data.lastDate,
    });
  }

  // Sort by Value descending by default
  rows.sort((a, b) => b.value - a.value);

  return {
    rows,
    grandTotal: {
      invoiceCount: allInvoices.size,
      packQty: grandPackQty,
      totalQty: grandTotalQty,
      value: roundedGrandVal,
      percentOfTotal: roundedGrandVal > 0 ? 100 : 0,
    },
  };
}

// -------------------------------------------------------------
// S5: Freight Report Sales
// -------------------------------------------------------------
export interface S5SummaryRow {
  date: string;
  totalQty: number;
  totalFreight: number;
}

export interface S5DetailedRow {
  date: string;
  partyName: string;
  invoiceNo: string;
  freight: number;
  totalQtyInInvoice: number;
}

export function computeS5FreightReport(invoices: Invoice[]): {
  summaryRows: S5SummaryRow[];
  detailedRows: S5DetailedRow[];
  grandTotal: { totalQty: number; totalFreight: number };
} {
  // Key constraint: Freight is recorded EXACTLY ONCE per invoice!
  const dateMap = new Map<string, { totalQty: number; totalFreight: number }>();
  const detailedRows: S5DetailedRow[] = [];

  let grandQty = 0;
  let grandFreight = 0;

  for (const inv of invoices) {
    const party = PARTY_MAP.get(inv.partyId);
    const partyName = party ? party.name : 'Unknown Party';

    // Total quantity in this invoice across all its item lines
    const invQty = inv.items.reduce((sum, item) => sum + item.totalQty, 0);

    detailedRows.push({
      date: inv.date,
      partyName,
      invoiceNo: inv.invoiceNo,
      freight: inv.freight,
      totalQtyInInvoice: invQty,
    });

    const dateData = dateMap.get(inv.date) || { totalQty: 0, totalFreight: 0 };
    dateData.totalQty += invQty;
    dateData.totalFreight = Math.round((dateData.totalFreight + inv.freight) * 100) / 100;
    dateMap.set(inv.date, dateData);

    grandQty += invQty;
    grandFreight += inv.freight;
  }

  // Summary rows sorted by date desc
  const summaryRows: S5SummaryRow[] = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      totalQty: data.totalQty,
      totalFreight: Math.round(data.totalFreight * 100) / 100,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Detailed rows sorted by date desc, then invoiceNo
  detailedRows.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.invoiceNo.localeCompare(a.invoiceNo);
  });

  return {
    summaryRows,
    detailedRows,
    grandTotal: {
      totalQty: grandQty,
      totalFreight: Math.round(grandFreight * 100) / 100,
    },
  };
}
