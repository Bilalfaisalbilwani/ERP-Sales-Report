import { Company, Salesman, Party, Distributor, ItemGroup, Product, Invoice, InvoiceItemLine } from '../types';

export const COMPANIES: Company[] = [
  { id: 'comp-1', code: 'UNI', name: 'Unika' },
  { id: 'comp-2', code: 'PST', name: 'Pasta' },
  { id: 'comp-3', code: 'EDS', name: 'Edison' },
];

export const SALESMEN: Salesman[] = [
  { id: 'sm-1', code: 'SM-01', name: 'Ahmed Khan' },
  { id: 'sm-2', code: 'SM-02', name: 'Bilal Ahmed' },
  { id: 'sm-3', code: 'SM-03', name: 'Usman Ali' },
  { id: 'sm-4', code: 'SM-04', name: 'Hamza Sheikh' },
  { id: 'sm-5', code: 'SM-05', name: 'Salman Raza' },
  { id: 'sm-6', code: 'SM-06', name: 'Tariq Mehmood' },
  { id: 'sm-7', code: 'SM-07', name: 'Faisal Farooq' },
  { id: 'sm-8', code: 'SM-08', name: 'Zeeshan Qureshi' },
];

export const DISTRIBUTORS: Distributor[] = [
  { id: 'dist-1', code: 'DST-KHI', name: 'Karachi Wholesale Traders', city: 'Karachi' },
  { id: 'dist-2', code: 'DST-LHR', name: 'Lahore Distribution House', city: 'Lahore' },
  { id: 'dist-3', code: 'DST-ISB', name: 'Prime Retail Supply', city: 'Islamabad' },
  { id: 'dist-4', code: 'DST-MTR', name: 'Metro Distributors', city: 'Karachi' },
  { id: 'dist-5', code: 'DST-AMD', name: 'Al Madina Traders', city: 'Rawalpindi' },
  { id: 'dist-6', code: 'DST-PCH', name: 'Punjab Consumer Hub', city: 'Faisalabad' },
  { id: 'dist-7', code: 'DST-RTL', name: 'Rawalpindi Trade Link', city: 'Rawalpindi' },
  { id: 'dist-8', code: 'DST-SBS', name: 'Sindh Bulk Supplies', city: 'Hyderabad' },
];

export const PARTIES: Party[] = [
  { id: 'pty-1', code: 'PTY-101', name: 'Al-Fatah Supermarket', distributorId: 'dist-2', city: 'Lahore' },
  { id: 'pty-2', code: 'PTY-102', name: 'Imtiaz Mega Store', distributorId: 'dist-1', city: 'Karachi' },
  { id: 'pty-3', code: 'PTY-103', name: 'Chase Up Mart', distributorId: 'dist-1', city: 'Karachi' },
  { id: 'pty-4', code: 'PTY-104', name: 'Naheed Supermarket', distributorId: 'dist-4', city: 'Karachi' },
  { id: 'pty-5', code: 'PTY-105', name: 'Rainbow Cash & Carry', distributorId: 'dist-2', city: 'Lahore' },
  { id: 'pty-6', code: 'PTY-106', name: 'Metro Cash & Carry', distributorId: 'dist-3', city: 'Islamabad' },
  { id: 'pty-7', code: 'PTY-107', name: 'Hyperstar Hypermarket', distributorId: 'dist-2', city: 'Lahore' },
  { id: 'pty-8', code: 'PTY-108', name: 'Save Mart', distributorId: 'dist-3', city: 'Islamabad' },
  { id: 'pty-9', code: 'PTY-109', name: 'Green Valley Express', distributorId: 'dist-5', city: 'Rawalpindi' },
  { id: 'pty-10', code: 'PTY-110', name: 'City Mart Gulberg', distributorId: 'dist-2', city: 'Lahore' },
  { id: 'pty-11', code: 'PTY-111', name: 'Universal Department Store', distributorId: 'dist-6', city: 'Faisalabad' },
  { id: 'pty-12', code: 'PTY-112', name: 'Pioneer General Store', distributorId: 'dist-7', city: 'Rawalpindi' },
  { id: 'pty-13', code: 'PTY-113', name: 'Apex Mart', distributorId: 'dist-8', city: 'Hyderabad' },
  { id: 'pty-14', code: 'PTY-114', name: 'Crown Grocers', distributorId: 'dist-1', city: 'Karachi' },
  { id: 'pty-15', code: 'PTY-115', name: 'Falcon Foods & General', distributorId: 'dist-4', city: 'Karachi' },
];

export const ITEM_GROUPS: ItemGroup[] = [
  { id: 'grp-1', code: 'BEV', name: 'Beverages' },
  { id: 'grp-2', code: 'SNK', name: 'Snacks' },
  { id: 'grp-3', code: 'DAI', name: 'Dairy Products' },
  { id: 'grp-4', code: 'HSH', name: 'Household' },
  { id: 'grp-5', code: 'PER', name: 'Personal Care' },
];

export const PRODUCTS: Product[] = [
  // Beverages (grp-1)
  { id: 'prd-01', code: 'BEV-001', name: 'Citrus Burst Juice 500ml', itemGroupId: 'grp-1', packSizeName: '12 x 500ml', unitsPerPack: 12, unitName: 'Bottles', standardRate: 85.00 },
  { id: 'prd-02', code: 'BEV-002', name: 'Premium Mango Nectar 1L', itemGroupId: 'grp-1', packSizeName: '6 x 1L', unitsPerPack: 6, unitName: 'Packs', standardRate: 195.00 },
  { id: 'prd-03', code: 'BEV-003', name: 'Sparkling Soda Lemon 250ml', itemGroupId: 'grp-1', packSizeName: '24 x 250ml', unitsPerPack: 24, unitName: 'Cans', standardRate: 65.00 },
  { id: 'prd-04', code: 'BEV-004', name: 'Natural Spring Water 1.5L', itemGroupId: 'grp-1', packSizeName: '6 x 1.5L', unitsPerPack: 6, unitName: 'Bottles', standardRate: 70.00 },
  { id: 'prd-05', code: 'BEV-005', name: 'Iced Peach Tea 330ml', itemGroupId: 'grp-1', packSizeName: '24 x 330ml', unitsPerPack: 24, unitName: 'Cans', standardRate: 110.00 },

  // Snacks (grp-2)
  { id: 'prd-06', code: 'SNK-001', name: 'Crinkle Cut Potato Chips 60g', itemGroupId: 'grp-2', packSizeName: '24 x 60g', unitsPerPack: 24, unitName: 'Packets', standardRate: 50.00 },
  { id: 'prd-07', code: 'SNK-002', name: 'Roasted Salted Almonds 100g', itemGroupId: 'grp-2', packSizeName: '12 x 100g', unitsPerPack: 12, unitName: 'Packs', standardRate: 320.00 },
  { id: 'prd-08', code: 'SNK-003', name: 'Butter Cookies Family Pack 300g', itemGroupId: 'grp-2', packSizeName: '12 x 300g', unitsPerPack: 12, unitName: 'Boxes', standardRate: 180.00 },
  { id: 'prd-09', code: 'SNK-004', name: 'Cheese Pretzel Crisps 80g', itemGroupId: 'grp-2', packSizeName: '20 x 80g', unitsPerPack: 20, unitName: 'Packets', standardRate: 75.00 },
  { id: 'prd-10', code: 'SNK-005', name: 'Choco Crunch Wafer Bar 45g', itemGroupId: 'grp-2', packSizeName: '36 x 45g', unitsPerPack: 36, unitName: 'Bars', standardRate: 40.00 },

  // Dairy Products (grp-3)
  { id: 'prd-11', code: 'DAI-001', name: 'Full Cream Milk Tetra 1L', itemGroupId: 'grp-3', packSizeName: '12 x 1L', unitsPerPack: 12, unitName: 'Cartons', standardRate: 260.00 },
  { id: 'prd-12', code: 'DAI-002', name: 'Salted Table Butter 200g', itemGroupId: 'grp-3', packSizeName: '24 x 200g', unitsPerPack: 24, unitName: 'Blocks', standardRate: 340.00 },
  { id: 'prd-13', code: 'DAI-003', name: 'Cheddar Cheese Slices 200g', itemGroupId: 'grp-3', packSizeName: '16 x 200g', unitsPerPack: 16, unitName: 'Packs', standardRate: 420.00 },
  { id: 'prd-14', code: 'DAI-004', name: 'Greek Style Plain Yogurt 400g', itemGroupId: 'grp-3', packSizeName: '12 x 400g', unitsPerPack: 12, unitName: 'Tubs', standardRate: 160.00 },
  { id: 'prd-15', code: 'DAI-005', name: 'Whipping Cream 250ml', itemGroupId: 'grp-3', packSizeName: '12 x 250ml', unitsPerPack: 12, unitName: 'Packs', standardRate: 230.00 },

  // Household (grp-4)
  { id: 'prd-16', code: 'HSH-001', name: 'Ultra Clean Dishwashing Gel 500ml', itemGroupId: 'grp-4', packSizeName: '12 x 500ml', unitsPerPack: 12, unitName: 'Bottles', standardRate: 145.00 },
  { id: 'prd-17', code: 'HSH-002', name: 'Surface Disinfectant Floral 1L', itemGroupId: 'grp-4', packSizeName: '8 x 1L', unitsPerPack: 8, unitName: 'Bottles', standardRate: 280.00 },
  { id: 'prd-18', code: 'HSH-003', name: 'Laundry Liquid Detergent 2L', itemGroupId: 'grp-4', packSizeName: '4 x 2L', unitsPerPack: 4, unitName: 'Jugs', standardRate: 680.00 },
  { id: 'prd-19', code: 'HSH-004', name: 'Microfiber Cleaning Cloth 3pk', itemGroupId: 'grp-4', packSizeName: '20 x 3pk', unitsPerPack: 20, unitName: 'Sets', standardRate: 190.00 },
  { id: 'prd-20', code: 'HSH-005', name: 'Air Freshener Lavender Spray 300ml', itemGroupId: 'grp-4', packSizeName: '12 x 300ml', unitsPerPack: 12, unitName: 'Cans', standardRate: 220.00 },

  // Personal Care (grp-5)
  { id: 'prd-21', code: 'PER-001', name: 'Moisturizing Hand Soap 250ml', itemGroupId: 'grp-5', packSizeName: '12 x 250ml', unitsPerPack: 12, unitName: 'Bottles', standardRate: 175.00 },
  { id: 'prd-22', code: 'PER-002', name: 'Herbal Shampoo Anti-Dandruff 400ml', itemGroupId: 'grp-5', packSizeName: '12 x 400ml', unitsPerPack: 12, unitName: 'Bottles', standardRate: 460.00 },
  { id: 'prd-23', code: 'PER-003', name: 'Deep Clean Charcoal Toothpaste 120g', itemGroupId: 'grp-5', packSizeName: '24 x 120g', unitsPerPack: 24, unitName: 'Tubes', standardRate: 130.00 },
  { id: 'prd-24', code: 'PER-004', name: 'Soothing Aloe Vera Body Lotion 200ml', itemGroupId: 'grp-5', packSizeName: '12 x 200ml', unitsPerPack: 12, unitName: 'Bottles', standardRate: 350.00 },
];

// Helper to look up product
export const PRODUCT_MAP = new Map<string, Product>(PRODUCTS.map(p => [p.id, p]));
export const ITEM_GROUP_MAP = new Map<string, ItemGroup>(ITEM_GROUPS.map(g => [g.id, g]));
export const SALESMAN_MAP = new Map<string, Salesman>(SALESMEN.map(s => [s.id, s]));
export const DISTRIBUTOR_MAP = new Map<string, Distributor>(DISTRIBUTORS.map(d => [d.id, d]));
export const PARTY_MAP = new Map<string, Party>(PARTIES.map(p => [p.id, p]));
export const COMPANY_MAP = new Map<string, Company>(COMPANIES.map(c => [c.id, c]));

// Deterministic seedable generator for consistent dummy invoices
function createInvoices(): Invoice[] {
  const invoices: Invoice[] = [];

  // Realistic invoice configuration templates
  // Dates span 2026-09-01 to 2026-10-22
  const dateList: string[] = [
    // Today: 2026-10-22 (Key requirement: rich data for today's default S1 view!)
    '2026-10-22', '2026-10-22', '2026-10-22', '2026-10-22', '2026-10-22', 
    '2026-10-22', '2026-10-22', '2026-10-22', '2026-10-22', '2026-10-22',
    '2026-10-22', '2026-10-22', '2026-10-22', '2026-10-22',
    // Recent days
    '2026-10-21', '2026-10-21', '2026-10-21', '2026-10-21', '2026-10-21',
    '2026-10-20', '2026-10-20', '2026-10-20', '2026-10-20',
    '2026-10-19', '2026-10-19', '2026-10-19',
    '2026-10-18', '2026-10-18', '2026-10-18', '2026-10-18',
    '2026-10-17', '2026-10-17', '2026-10-17',
    '2026-10-16', '2026-10-16', '2026-10-16', '2026-10-16',
    '2026-10-15', '2026-10-15', '2026-10-15', '2026-10-15',
    '2026-10-14', '2026-10-14', '2026-10-14',
    '2026-10-12', '2026-10-12', '2026-10-12', '2026-10-12',
    '2026-10-11', '2026-10-11', '2026-10-11',
    '2026-10-10', '2026-10-10', '2026-10-10', '2026-10-10',
    '2026-10-09', '2026-10-09', '2026-10-09',
    '2026-10-08', '2026-10-08', '2026-10-08', '2026-10-08',
    '2026-10-07', '2026-10-07', '2026-10-07',
    '2026-10-06', '2026-10-06', '2026-10-06',
    '2026-10-05', '2026-10-05', '2026-10-05', '2026-10-05',
    '2026-10-04', '2026-10-04', '2026-10-04',
    '2026-10-03', '2026-10-03', '2026-10-03', '2026-10-03',
    '2026-10-02', '2026-10-02', '2026-10-02',
    '2026-10-01', '2026-10-01', '2026-10-01', '2026-10-01',
    // September
    '2026-09-30', '2026-09-29', '2026-09-28', '2026-09-27', '2026-09-26',
    '2026-09-25', '2026-09-24', '2026-09-22', '2026-09-20', '2026-09-18',
    '2026-09-15', '2026-09-14', '2026-09-12', '2026-09-10', '2026-09-08',
    '2026-09-05', '2026-09-04', '2026-09-02', '2026-09-01'
  ];

  // Freight tiers based on party distance/volume
  const freightTiers = [450, 750, 1200, 1600, 2200, 850, 600, 1400, 1850, 950, 1100, 2400];

  let invoiceSequence = 1001;

  // Generate 180 invoices
  for (let i = 0; i < dateList.length; i++) {
    const date = dateList[i];
    const companyIndex = i % COMPANIES.length;
    const company = COMPANIES[companyIndex];
    
    // Choose party and its distributor
    const partyIndex = (i * 3 + 2) % PARTIES.length;
    const party = PARTIES[partyIndex];
    const distributorId = party.distributorId;

    // Salesman assignment
    const salesmanIndex = (i * 2 + (i % 3)) % SALESMEN.length;
    const salesman = SALESMEN[salesmanIndex];

    const invoiceNo = `INV-2026-${invoiceSequence++}`;
    const freight = freightTiers[i % freightTiers.length];

    // Determine 2 to 5 product items for this invoice
    const numItems = ((i % 4) + 2); // 2, 3, 4, or 5 item lines
    const items: InvoiceItemLine[] = [];

    for (let j = 0; j < numItems; j++) {
      const prodIndex = (i * 5 + j * 7 + (i % 2)) % PRODUCTS.length;
      const product = PRODUCTS[prodIndex];

      // Pack Qty (e.g. 5 to 40 packs)
      let packQty = ((i * 3 + j * 4) % 35) + 5;
      const totalQty = packQty * product.unitsPerPack;
      const rate = product.standardRate;

      // Realistic discount (e.g. 0%, 2%, 3%, 5%)
      const discountPct = (i + j) % 5 === 0 ? 0.05 : ((i + j) % 3 === 0 ? 0.025 : 0);
      const grossValue = totalQty * rate;
      const discount = Math.round(grossValue * discountPct * 100) / 100;
      const netValue = Math.round((grossValue - discount) * 100) / 100;

      items.push({
        id: `line-${invoiceSequence}-${j}`,
        productId: product.id,
        packQty,
        totalQty,
        rate,
        discount,
        grossValue,
        netValue
      });
    }

    // Add a return/adjustment line for a couple of specific invoices to test negative values gracefully
    if (i === 18) {
      // 1 item return on Oct 20
      const retProd = PRODUCTS[0];
      const retPackQty = -2;
      const retTotalQty = retPackQty * retProd.unitsPerPack;
      const gross = retTotalQty * retProd.standardRate;
      items.push({
        id: `line-${invoiceSequence}-ret`,
        productId: retProd.id,
        packQty: retPackQty,
        totalQty: retTotalQty,
        rate: retProd.standardRate,
        discount: 0,
        grossValue: gross,
        netValue: gross
      });
    }

    invoices.push({
      id: `inv-${invoiceSequence}`,
      invoiceNo,
      date,
      companyId: company.id,
      salesmanId: salesman.id,
      distributorId,
      partyId: party.id,
      freight,
      items
    });
  }

  // Duplicate a few more records into additional days to hit ~190 total invoices with deep distributor & salesman coverage
  for (let k = 0; k < 30; k++) {
    const baseDate = k < 10 ? '2026-10-22' : (k < 20 ? '2026-10-15' : '2026-10-05');
    const comp = COMPANIES[(k + 1) % COMPANIES.length];
    const sm = SALESMEN[(k + 3) % SALESMEN.length];
    const pty = PARTIES[(k * 4) % PARTIES.length];
    const invNo = `INV-2026-${invoiceSequence++}`;
    const freight = 650 + (k * 100) % 1500;

    const prd1 = PRODUCTS[(k * 2) % PRODUCTS.length];
    const prd2 = PRODUCTS[(k * 3 + 1) % PRODUCTS.length];

    const pack1 = ((k * 2) % 20) + 8;
    const tot1 = pack1 * prd1.unitsPerPack;
    const gross1 = tot1 * prd1.standardRate;
    const disc1 = Math.round(gross1 * 0.02 * 100) / 100;

    const pack2 = ((k * 3) % 15) + 6;
    const tot2 = pack2 * prd2.unitsPerPack;
    const gross2 = tot2 * prd2.standardRate;
    const disc2 = 0;

    invoices.push({
      id: `inv-${invoiceSequence}`,
      invoiceNo: invNo,
      date: baseDate,
      companyId: comp.id,
      salesmanId: sm.id,
      distributorId: pty.distributorId,
      partyId: pty.id,
      freight,
      items: [
        {
          id: `line-${invoiceSequence}-1`,
          productId: prd1.id,
          packQty: pack1,
          totalQty: tot1,
          rate: prd1.standardRate,
          discount: disc1,
          grossValue: gross1,
          netValue: Math.round((gross1 - disc1) * 100) / 100
        },
        {
          id: `line-${invoiceSequence}-2`,
          productId: prd2.id,
          packQty: pack2,
          totalQty: tot2,
          rate: prd2.standardRate,
          discount: disc2,
          grossValue: gross2,
          netValue: Math.round((gross2 - disc2) * 100) / 100
        }
      ]
    });
  }

  return invoices;
}

export const INVOICES: Invoice[] = createInvoices();
