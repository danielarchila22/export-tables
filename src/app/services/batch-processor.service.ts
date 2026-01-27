import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DataRecord, BatchProgress } from '../models/user.model';
//sistema de procesamientos por lotes/hilos
@Injectable({
  providedIn: 'root'
})
export class BatchProcessorService {

  private progressSubject = new BehaviorSubject<BatchProgress | null>(null);
  public progress$: Observable<BatchProgress | null> =
    this.progressSubject.asObservable();

  private isProcessing = false;
  private shouldCancel = false;

  async processBatches(
    data: DataRecord[],
    batchSize: number,
    processFn: (batch: DataRecord[], batchIndex: number) => Promise<void>
  ): Promise<void> {

    if (this.isProcessing) {
      throw new Error('Ya hay un proceso en curso');
    }

    this.isProcessing = true;
    this.shouldCancel = false;

    const totalRows = data.length;
    const totalBatches = Math.ceil(totalRows / batchSize);

    try {
      for (let i = 0; i < totalBatches; i++) {
        if (this.shouldCancel) {
          throw new Error('Proceso cancelado');
        }

        const start = i * batchSize;
        const end = Math.min(start + batchSize, totalRows);
        const batch = data.slice(start, end);

        const progress: BatchProgress = {
          currentBatch: i + 1,
          totalBatches,
          processedRows: end,
          totalRows,
          percentage: Math.round(((i + 1) / totalBatches) * 100)
        };

        this.progressSubject.next(progress);

        await processFn(batch, i);

        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  cancelProcessing(): void {
    this.shouldCancel = true;
  }

  resetProgress(): void {
    this.progressSubject.next(null);
  }
}

