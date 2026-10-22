import ExcelJS from 'exceljs';
import { formatDate } from './formatters';

export type ExcelColumnType = 'text' | 'currency' | 'quantity' | 'percent' | 'date';

export interface ExcelColumnDef {
  header: string;
  dataKey: string;
  type?: ExcelColumnType;
  width?: number;
}

export interface ExportExcelOptions {
  fileName: string;
  reportCode: string;
  reportTitle: string;
  viewName: string;
  companyName: string;
  dateRange: string;
  salesmenText?: string;
  itemGroupsText?: string;
  distributorsText?: string;
  columns: ExcelColumnDef[];
  data: Record<string, any>[];
  grandTotal?: Record<string, any>;
}

/**
 * Format and style ERP Sales Reports in Excel using ExcelJS
 * Closely matches the visual presentation, grouping, colors, borders,
 * number formatting, and red negative values from the screen.
 */
export async function exportReportToExcel(options: ExportExcelOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP Sales Analytics Dashboard';
  workbook.lastModifiedBy = 'ERP Sales Analytics Dashboard';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheetName = (options.reportCode || 'Report').slice(0, 31);
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  const numCols = options.columns.length;

  // -------------------------------------------------------------
  // Theme Color Definitions (matching screen ERP design)
  // -------------------------------------------------------------
  const COLOR_TITLE_BG = 'FF0F172A'; // Slate-900
  const COLOR_TITLE_FG = 'FFFFFFFF'; // White
  const COLOR_SUBTITLE_FG = 'FF94A3B8'; // Slate-400

  const COLOR_META_BG = 'FFF8FAFC'; // Slate-50
  const COLOR_META_LABEL = 'FF475569'; // Slate-600
  const COLOR_META_VALUE = 'FF0F172A'; // Slate-900
  const COLOR_META_BORDER = 'FFE2E8F0'; // Slate-200

  const COLOR_HEADER_BG = 'FFE2E8F0'; // Slate-200
  const COLOR_HEADER_FG = 'FF1E293B'; // Slate-800
  const COLOR_HEADER_BORDER = 'FF94A3B8'; // Slate-400

  const COLOR_ROW_EVEN = 'FFFFFFFF'; // White
  const COLOR_ROW_ODD = 'FFF8FAFC'; // Slate-50
  const COLOR_ROW_BORDER = 'FFE2E8F0'; // Slate-200

  const COLOR_GROUP_BG = 'FFEFF6FF'; // Blue-50
  const COLOR_GROUP_FG = 'FF1E40AF'; // Blue-800
  const COLOR_GROUP_BORDER = 'FFBFDBFE'; // Blue-200

  const COLOR_SUBTOTAL_BG = 'FFF1F5F9'; // Slate-100
  const COLOR_SUBTOTAL_FG = 'FF0F172A'; // Slate-900
  const COLOR_SUBTOTAL_BORDER = 'FFCBD5E1'; // Slate-300

  const COLOR_GRAND_TOTAL_BG = 'FFE2E8F0'; // Slate-200
  const COLOR_GRAND_TOTAL_FG = 'FF0F172A'; // Slate-900

  const COLOR_NEGATIVE_RED = 'FFDC2626'; // Red-600 for negative numbers

  // -------------------------------------------------------------
  // Row 1 & 2: Primary Report Title Banner
  // -------------------------------------------------------------
  const titleRow = worksheet.addRow([`ERP REPORTS  |  ${options.reportCode}: ${options.reportTitle}`]);
  titleRow.height = 30;
  worksheet.mergeCells(1, 1, 1, Math.max(numCols, 4));

  const titleCell = titleRow.getCell(1);
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLOR_TITLE_BG },
  };
  titleCell.font = {
    name: 'Segoe UI',
    size: 13,
    bold: true,
    color: { argb: COLOR_TITLE_FG },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // -------------------------------------------------------------
  // Rows 2-5: Metadata Filter Card
  // -------------------------------------------------------------
  const metadataRows = [
    [
      { label: 'Report View:', value: options.viewName },
      { label: 'Generated On:', value: `${formatDate(new Date().toISOString().split('T')[0])}` },
    ],
    [
      { label: 'Company:', value: options.companyName },
      { label: 'Date Range:', value: options.dateRange },
    ],
    [
      { label: 'Salesman:', value: options.salesmenText || 'All Salesmen' },
      { label: 'Item Group:', value: options.itemGroupsText || 'All Item Groups' },
    ],
    [
      { label: 'Distributor:', value: options.distributorsText || 'All Distributors' },
      { label: 'Environment:', value: 'ERP Sales Analytics · Official Export' },
    ],
  ];

  metadataRows.forEach((metaPair) => {
    const row = worksheet.addRow([
      metaPair[0].label,
      metaPair[0].value,
      metaPair[1].label,
      metaPair[1].value,
    ]);
    row.height = 20;

    // Col 1: Label
    const c1 = row.getCell(1);
    c1.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_META_LABEL } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_META_BG } };
    c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    // Col 2: Value
    const c2 = row.getCell(2);
    c2.font = { name: 'Segoe UI', size: 9, bold: false, color: { argb: COLOR_META_VALUE } };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_META_BG } };
    c2.alignment = { vertical: 'middle', horizontal: 'left' };

    // Col 3: Label
    const c3 = row.getCell(3);
    c3.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_META_LABEL } };
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_META_BG } };
    c3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    // Col 4: Value
    const c4 = row.getCell(4);
    c4.font = { name: 'Segoe UI', size: 9, bold: false, color: { argb: COLOR_META_VALUE } };
    c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_META_BG } };
    c4.alignment = { vertical: 'middle', horizontal: 'left' };

    // Add borders to metadata block
    [c1, c2, c3, c4].forEach((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: COLOR_META_BORDER } },
        bottom: { style: 'thin', color: { argb: COLOR_META_BORDER } },
        left: { style: 'thin', color: { argb: COLOR_META_BORDER } },
        right: { style: 'thin', color: { argb: COLOR_META_BORDER } },
      };
    });
  });

  // Empty separator row
  const spacerRow = worksheet.addRow([]);
  spacerRow.height = 12;

  // -------------------------------------------------------------
  // Column Headers Row
  // -------------------------------------------------------------
  const headerValues = options.columns.map((c) => c.header);
  const headerRow = worksheet.addRow(headerValues);
  headerRow.height = 26;

  headerRow.eachCell((cell, colNumber) => {
    const colDef = options.columns[colNumber - 1];
    const isNumeric = colDef?.type === 'currency' || colDef?.type === 'quantity' || colDef?.type === 'percent';
    const isCenter = colDef?.type === 'date';

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_HEADER_BG },
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: COLOR_HEADER_FG },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: isNumeric ? 'right' : isCenter ? 'center' : 'left',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: COLOR_HEADER_BORDER } },
      bottom: { style: 'medium', color: { argb: COLOR_HEADER_BORDER } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Freeze panes so header row stays pinned when scrolling
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: headerRow.number,
      showGridLines: true,
    },
  ];

  // Helper to parse clean numeric value
  const parseNumeric = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const clean = val.replace(/,/g, '').replace(/%/g, '').trim();
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    }
    return null;
  };

  // -------------------------------------------------------------
  // Data Rows & Groups
  // -------------------------------------------------------------
  let dataIndex = 0;

  options.data.forEach((rowObj) => {
    // 1. Group Header Row (e.g. Item Group header or Salesman Group header)
    if (rowObj.__isGroupHeader) {
      const grpTitle = rowObj.__groupTitle || String(rowObj[options.columns[0].dataKey] || '');
      const grpRow = worksheet.addRow([grpTitle]);
      grpRow.height = 24;
      worksheet.mergeCells(grpRow.number, 1, grpRow.number, numCols);

      const grpCell = grpRow.getCell(1);
      grpCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLOR_GROUP_BG },
      };
      grpCell.font = {
        name: 'Segoe UI',
        size: 10.5,
        bold: true,
        color: { argb: COLOR_GROUP_FG },
      };
      grpCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      grpCell.border = {
        top: { style: 'thin', color: { argb: COLOR_GROUP_BORDER } },
        bottom: { style: 'thin', color: { argb: COLOR_GROUP_BORDER } },
        left: { style: 'thin', color: { argb: COLOR_GROUP_BORDER } },
        right: { style: 'thin', color: { argb: COLOR_GROUP_BORDER } },
      };
      return;
    }

    // 2. Subtotal Row
    if (rowObj.__isSubtotal) {
      const rowValues = options.columns.map((col) => rowObj[col.dataKey]);
      const subtotalRow = worksheet.addRow(rowValues);
      subtotalRow.height = 22;

      subtotalRow.eachCell((cell, colNumber) => {
        const colDef = options.columns[colNumber - 1];
        const val = rowObj[colDef.dataKey];
        const numVal = parseNumeric(val);

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLOR_SUBTOTAL_BG },
        };

        const isNegative = numVal !== null && numVal < 0;

        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: isNegative ? COLOR_NEGATIVE_RED : COLOR_SUBTOTAL_FG },
        };

        cell.border = {
          top: { style: 'thin', color: { argb: COLOR_SUBTOTAL_BORDER } },
          bottom: { style: 'thin', color: { argb: COLOR_SUBTOTAL_BORDER } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if (colDef.type === 'currency' && numVal !== null) {
          cell.value = numVal;
          cell.numFmt = '#,##0.00;[Red]-#,##0.00;"0.00"';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colDef.type === 'quantity' && numVal !== null) {
          cell.value = numVal;
          cell.numFmt = '#,##0;[Red]-#,##0;"0"';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colDef.type === 'percent' && numVal !== null) {
          cell.value = numVal > 1 ? numVal / 100 : numVal;
          cell.numFmt = '0.00%;[Red]-0.00%;0.00%';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
      return;
    }

    // 3. Regular Data Row
    const rowValues = options.columns.map((col) => rowObj[col.dataKey]);
    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 20;

    const rowBg = dataIndex % 2 === 0 ? COLOR_ROW_EVEN : COLOR_ROW_ODD;
    dataIndex++;

    dataRow.eachCell((cell, colNumber) => {
      const colDef = options.columns[colNumber - 1];
      const val = rowObj[colDef.dataKey];
      const numVal = parseNumeric(val);

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };

      const isNegative = numVal !== null && numVal < 0;

      cell.font = {
        name: 'Segoe UI',
        size: 9.5,
        color: { argb: isNegative ? COLOR_NEGATIVE_RED : 'FF0F172A' },
      };

      cell.border = {
        top: { style: 'thin', color: { argb: COLOR_ROW_BORDER } },
        bottom: { style: 'thin', color: { argb: COLOR_ROW_BORDER } },
        left: { style: 'thin', color: { argb: COLOR_ROW_BORDER } },
        right: { style: 'thin', color: { argb: COLOR_ROW_BORDER } },
      };

      if (colDef.type === 'currency') {
        if (numVal !== null) {
          cell.value = numVal;
          cell.numFmt = '#,##0.00;[Red]-#,##0.00;"0.00"';
        }
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colDef.type === 'quantity') {
        if (numVal !== null) {
          cell.value = numVal;
          cell.numFmt = '#,##0;[Red]-#,##0;"0"';
        }
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colDef.type === 'percent') {
        if (numVal !== null) {
          cell.value = numVal > 1 ? numVal / 100 : numVal;
          cell.numFmt = '0.00%;[Red]-0.00%;0.00%';
        }
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colDef.type === 'date') {
        cell.value = val !== undefined && val !== null ? String(val) : '';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.value = val !== undefined && val !== null ? String(val) : '';
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // -------------------------------------------------------------
  // Grand Total Row
  // -------------------------------------------------------------
  if (options.grandTotal) {
    const totalValues = options.columns.map((col) => options.grandTotal![col.dataKey]);
    const totalRow = worksheet.addRow(totalValues);
    totalRow.height = 26;

    totalRow.eachCell((cell, colNumber) => {
      const colDef = options.columns[colNumber - 1];
      const val = options.grandTotal![colDef.dataKey];
      const numVal = parseNumeric(val);

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLOR_GRAND_TOTAL_BG },
      };

      const isNegative = numVal !== null && numVal < 0;

      cell.font = {
        name: 'Segoe UI',
        size: 10.5,
        bold: true,
        color: { argb: isNegative ? COLOR_NEGATIVE_RED : COLOR_GRAND_TOTAL_FG },
      };

      cell.border = {
        top: { style: 'medium', color: { argb: 'FF475569' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } }, // Double underline accounting standard
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };

      if (colDef.type === 'currency' && numVal !== null) {
        cell.value = numVal;
        cell.numFmt = '#,##0.00;[Red]-#,##0.00;"0.00"';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colDef.type === 'quantity' && numVal !== null) {
        cell.value = numVal;
        cell.numFmt = '#,##0;[Red]-#,##0;"0"';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colDef.type === 'percent' && numVal !== null) {
        cell.value = numVal > 1 ? numVal / 100 : numVal;
        cell.numFmt = '0.00%;[Red]-0.00%;0.00%';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  }

  // -------------------------------------------------------------
  // Intelligent Column Width Calculations
  // -------------------------------------------------------------
  options.columns.forEach((col, idx) => {
    let maxLen = col.header.length;

    options.data.forEach((row) => {
      const val = row[col.dataKey];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        if (strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      }
    });

    if (options.grandTotal && options.grandTotal[col.dataKey]) {
      const totalLen = String(options.grandTotal[col.dataKey]).length;
      if (totalLen > maxLen) maxLen = totalLen;
    }

    const calculatedWidth = Math.max(
      col.width || 12,
      Math.min(maxLen + 4, 45)
    );

    const sheetCol = worksheet.getColumn(idx + 1);
    sheetCol.width = calculatedWidth;
  });

  // -------------------------------------------------------------
  // Save & Download
  // -------------------------------------------------------------
  const cleanFileName = options.fileName.endsWith('.xlsx')
    ? options.fileName
    : `${options.fileName}.xlsx`;

  // Support both Browser download and Node.js testing
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = cleanFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  } else {
    // Node.js environment
    await workbook.xlsx.writeFile(cleanFileName);
  }
}
