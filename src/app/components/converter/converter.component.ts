import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
  //componente principal proyecto
  //carga json, eventos darg,drop, llam servicios
import { FileParserService } from '../../services/file-parser.service';
import { BatchProcessorService } from '../../services/batch-processor.service';
import { XlsxExportService } from '../../services/xlsx-export.service';
import { BatchProgress, DataRecord } from '../../models/user.model';

type ProcessingState = 'idle' | 'parsing' | 'processing' | 'complete' | 'error';

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="upload-zone"
      [class.active]="isDragOver()"
      (dragover)="onDragOver($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input
        #fileInput
        type="file"
        accept=".json"
        class="hidden"
        (change)="onFileSelected($event)"
      />
    </div>

    <div *ngIf="progress()" class="progress-bar">
      <div
        class="progress-fill"
        [style.width.%]="progress()?.percentage"
      ></div>
    </div>

    <button
      class="btn-primary"
      [disabled]="!selectedFile()"
      (click)="startConversion()"
    >
      Convertir y descargar
    </button>
  `,
})
export class ConverterComponent {

  private fileParser = inject(FileParserService);
  private batchProcessor = inject(BatchProcessorService);
  private xlsxExport = inject(XlsxExportService);

  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  state = signal<ProcessingState>('idle');
  errorMessage = signal('');
  progress = signal<BatchProgress | null>(null);

  private readonly batchSize = 1000;

  constructor() {
    this.batchProcessor.progress$.subscribe(p => {
      this.progress.set(p);
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  async startConversion(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    try {
      this.state.set('parsing');

      const records: DataRecord[] =
        await this.fileParser.parseJsonFile(file);

      this.state.set('processing');

      await this.batchProcessor.processBatches(
        records,
        this.batchSize,
        async (batch, batchIndex) => {
          this.xlsxExport.appendBatch(batch);
        }
      );

      this.xlsxExport.finalizeAndDownload('export.xlsx');
      this.state.set('complete');

    } catch (err) {
      this.state.set('error');
      this.errorMessage.set((err as Error).message);
    }
  }
}
