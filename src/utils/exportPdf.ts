import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './formatters';

export interface ExportPdfOptions {
  fileName: string;
  reportCode: string;
  reportTitle: string;
  viewName: string;
  companyName: string;
  dateRange: string;
  salesmenText?: string;
  itemGroupsText?: string;
  distributorsText?: string;
  filtersSummary?: string[];
  columns: { header: string; dataKey: string; align?: 'left' | 'right' | 'center' }[];
  data: Record<string, any>[];
  grandTotal?: Record<string, any>;
  orientation?: 'portrait' | 'landscape';
}

export function exportReportToPdf(options: ExportPdfOptions): void {
  const orientation = options.orientation || 'portrait';
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Top Navy Header Banner
  doc.setFillColor(15, 23, 42); // slate-900 navy
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`ERP Reports — ${options.reportCode}: ${options.reportTitle}`, 25, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`View: ${options.viewName}  |  Generated on: ${formatDate(new Date().toISOString().split('T')[0])}`, 25, 40);

  // 2. Active Filters Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(25, 58, pageWidth - 50, 52, 'FD');

  doc.setFontSize(8);
  const col1X = 35;
  const col2X = orientation === 'landscape' ? 440 : 290;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Company:', col1X, 72);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options.companyName, col1X + 50, 72);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Date Range:', col2X, 72);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options.dateRange, col2X + 60, 72);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Salesman:', col1X, 86);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const smText = options.salesmenText || 'All Salesmen';
  doc.text(smText, col1X + 50, 86, { maxWidth: (col2X - col1X - 60) });

  if (options.itemGroupsText) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Item Group:', col2X, 86);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(options.itemGroupsText, col2X + 60, 86, { maxWidth: pageWidth - col2X - 70 });
  }

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Distributor:', col1X, 100);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const distText = options.distributorsText || 'All Distributors';
  doc.text(distText, col1X + 50, 100, { maxWidth: pageWidth - 100 });

  const startY = 118;

  // 3. Prepare table rows
  const bodyRows: any[][] = [];

  options.data.forEach((row) => {
    if (row.__isGroupHeader) {
      bodyRows.push([
        {
          content: row.__groupTitle,
          colSpan: options.columns.length,
          styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        },
      ]);
    } else if (row.__isSubtotal) {
      const subRow = options.columns.map((col) => {
        return {
          content: row[col.dataKey] !== undefined ? String(row[col.dataKey]) : '',
          styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [15, 23, 42] },
        };
      });
      bodyRows.push(subRow);
    } else {
      const normalRow = options.columns.map((col) => {
        const val = row[col.dataKey];
        return val !== undefined && val !== null ? String(val) : '';
      });
      bodyRows.push(normalRow);
    }
  });

  // Grand Total row
  if (options.grandTotal) {
    const totalRow = options.columns.map((col) => {
      const val = options.grandTotal![col.dataKey];
      return {
        content: val !== undefined && val !== null ? String(val) : '',
        styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42] },
      };
    });
    bodyRows.push(totalRow);
  }

  // Column alignments
  const columnStyles: Record<number, any> = {};
  options.columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || 'left',
    };
  });

  autoTable(doc, {
    startY,
    head: [options.columns.map((c) => c.header)],
    body: bodyRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      textColor: [30, 41, 59],
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles,
    margin: { left: 25, right: 25, bottom: 35 },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(str, pageWidth - 75, pageHeight - 14);
      doc.text('ERP Sales Reports System — Confidential Client Report', 25, pageHeight - 14);
    },
  });

  doc.save(options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`);
}
