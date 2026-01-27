import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { DataRecord } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class XlsxExportService {

  private workbook: XLSX.WorkBook | null = null;
  private worksheet: XLSX.WorkSheet | null = null;
  private initialized = false;

  private init(batch: DataRecord[]) {
    const data = batch.map(r => ({ ...r }));
    this.worksheet = XLSX.utils.json_to_sheet(data);
    this.workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(this.workbook, this.worksheet, 'Data');
    this.initialized = true;
  }

  appendBatch(batch: DataRecord[]): void {
    if (!batch.length) return;

    if (!this.initialized) {
      this.init(batch);
      return;
    }

    const data = batch.map(r => ({ ...r }));
    XLSX.utils.sheet_add_json(this.worksheet!, data, {
      skipHeader: true,
      origin: -1
    });
  }

  finalizeAndDownload(filename: string): void {
    if (!this.workbook) {
      throw new Error('Workbook no inicializado');
    }

    XLSX.writeFile(this.workbook, filename);

    this.workbook = null;
    this.worksheet = null;
    this.initialized = false;
  }
}

