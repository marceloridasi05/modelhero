import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const FOOTER_TEXT = 'Documento gerado por ModelHero - modelhero.app';

interface ExportColumn {
  header: string;
  accessor: string | ((row: any) => string);
}

export function exportToPdf(
  data: any[],
  columns: ExportColumn[],
  title: string,
  filename: string
) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(`${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = data.map(row => 
    columns.map(col => {
      if (typeof col.accessor === 'function') {
        return col.accessor(row);
      }
      return String(row[col.accessor] ?? '');
    })
  );

  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 38,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [62, 86, 65] },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(FOOTER_TEXT, 14, pageHeight - 10);
    },
  });

  doc.save(`${filename}.pdf`);
}

export function exportToExcel(
  data: any[],
  columns: ExportColumn[],
  sheetName: string,
  filename: string
) {
  const exportData = data.map(row => {
    const obj: Record<string, string> = {};
    columns.forEach(col => {
      if (typeof col.accessor === 'function') {
        obj[col.header] = col.accessor(row);
      } else {
        obj[col.header] = String(row[col.accessor] ?? '');
      }
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  
  const rowCount = exportData.length + 1;
  XLSX.utils.sheet_add_aoa(ws, [['']], { origin: `A${rowCount + 1}` });
  XLSX.utils.sheet_add_aoa(ws, [[FOOTER_TEXT]], { origin: `A${rowCount + 2}` });
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
