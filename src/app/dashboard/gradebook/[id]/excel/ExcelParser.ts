import * as XLSX from 'xlsx';
import { ExcelData, ExcelWorkbook } from './types';

export class ExcelParser {
  static parseFile(file: File): Promise<ExcelWorkbook> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheets: Record<string, ExcelData> = {};

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            sheets[sheetName] = this.parseWorksheet(worksheet);
          }

          resolve({
            sheetNames: workbook.SheetNames,
            sheets,
          });
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static parseWorksheet(worksheet: XLSX.WorkSheet): ExcelData {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    const headers: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: range.s.r,
        c: col,
      });
      const cell = worksheet[cellAddress];
      headers.push(cell ? String(cell.v) : '');
    }

    const rows: (string | number)[][] = [];
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const rowData: (string | number)[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : '');
      }

      if (rowData.some((cell) => cell !== '')) {
        rows.push(rowData);
      }
    }

    return { headers, rows };
  }

  static parseFileForSheet(file: File, sheetName: string): Promise<ExcelData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          if (!workbook.SheetNames.includes(sheetName)) {
            reject(new Error(`Sheet "${sheetName}" not found`));
            return;
          }
          const worksheet = workbook.Sheets[sheetName];
          const excelData = this.parseWorksheet(worksheet);

          resolve({
            ...excelData,
            sheetNames: workbook.SheetNames,
            selectedSheet: sheetName,
          });
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static validateFile(file: File): string | null {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();

    if (!validExtensions.some((ext) => fileName.endsWith(ext))) {
      return 'Please select a valid Excel file (.xlsx or .xls)';
    }

    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }

    return null;
  }
}
