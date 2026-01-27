/*Creamos la interfaz*/
export type DataRecord = Record<string, unknown>;
/*unknown porque nuestro JSON puede tener cualquier campo*/

export interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  processedRows: number;
  totalRows: number;
  percentage: number;
}
