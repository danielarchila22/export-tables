import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

  //componente principal proyecto
  //carga json, eventos darg,drop, llam servicios
import { FileParserService } from '../../services/file-parser.service';
import { BatchProcessorService } from '../../services/batch-processor.service';
import { XlsxExportService } from '../../services/xlsx-export.service';
import { BatchProgress, DataRecord } from '../../models/user.model';
import { CsvExportService } from '../../services/csv-export.service';


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

    <div class="mt-4 flex gap-4">

  <button
    class="btn-primary"
    [disabled]="tableData().length === 0"
    (click)="exportarXlsx()"
  >
    Exportar Excel (.xlsx)
  </button>

  <button
    class="btn-primary"
    [disabled]="tableData().length === 0"
    (click)="exportarCsv()"
  >
    Exportar CSV (.csv)
  </button>

</div>
    <!-- Selección de formato de exportación -->
<div class="mt-4 flex gap-6 items-center">
  <span class="font-semibold">Formato de exportación:</span>
</div>

    <!-- Botones para generar datos -->
<div class="mt-4 flex gap-3">
  <button
    class="btn-primary"
    (click)="generarDatosMasivos(1000)"
  >
    Generar 1000 registros
  </button>

  <button
    class="btn-primary"
    (click)="generarDatosMasivos(10000)"
  >
    Generar 10.000 registros
  </button>

  <button
    class="btn-primary"
    (click)="generarDatosMasivos(100000)"
  >
    Generar 100.000 registros
  </button>
</div>

  <!-- Tabla de datos -->
<div *ngIf="tableData().length > 0" class="mt-6 overflow-auto max-h-[400px] border rounded">

  <table class="w-full border-collapse text-sm">
    <thead class="bg-gray-800 text-white sticky top-0">
      <tr>
        <th class="p-2 border">ID</th>
        <th class="p-2 border">Nombre</th>
        <th class="p-2 border">Correo</th>
      </tr>
    </thead>

    <tbody>
      <tr *ngFor="let row of tableData()">
        <td class="p-2 border">{{ row.id }}</td>
        <td class="p-2 border">{{ row.nombre }}</td>
        <td class="p-2 border">{{ row.correo }}</td>
      </tr>
    </tbody>
  </table>

</div>
 `,
})

export class ConverterComponent {

  private xlsxExport = inject(XlsxExportService);
  private csvExport = inject(CsvExportService);
  private fileParser = inject(FileParserService);
  private batchProcessor = inject(BatchProcessorService);

  tableData = signal<DataRecord[]>([]);
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
      this.cargarArchivo(file);
    }
  }

  async cargarArchivo(file: File): Promise<void> {
  try {
    this.state.set('parsing');

    const records = await this.fileParser.parseJsonFile(file);

    this.tableData.set(records);

    this.state.set('idle');

  } catch (err) {
    this.state.set('error');
    this.errorMessage.set((err as Error).message);
  }
}

async startConversion(): Promise<void> {
  const records = this.tableData();
  if (!records.length) return;

  this.state.set('processing');

  await this.batchProcessor.processBatches(
    records,
    this.batchSize,
    async (batch) => {
      this.xlsxExport.appendBatch(batch);
    }
  );

  this.xlsxExport.finalizeAndDownload('export.xlsx');
  this.state.set('complete');
}

exportarXlsx(): void {
  const data = this.tableData();
  if (!data.length) return;

  this.state.set('processing');

  this.batchProcessor.processBatches(
    data,
    this.batchSize,
    async (batch) => {
      this.xlsxExport.appendBatch(batch);
    }
  ).then(() => {
    this.xlsxExport.finalizeAndDownload('export.xlsx');
    this.state.set('complete');
  });
}

exportarCsv(): void {
  const data = this.tableData();
  if (!data.length) return;

  this.csvExport.export(data, 'export.csv');
}

  generarLote(inicio: number, tamaño: number): DataRecord[] {
  const datos: DataRecord[] = [];

  for (let i = inicio; i < inicio + tamaño; i++) {
    datos.push({
      id: i,
      nombre: `Usuario ${i}`,
      correo: `usuario${i}@correo.com`
    });
  }
  return datos;

}

  async generarDatosMasivos(total: number): Promise<void> {
  const tamañoLote = this.batchSize;
  const todosLosDatos: DataRecord[] = [];

  await this.batchProcessor.processBatches(
    Array.from({ length: Math.ceil(total / tamañoLote) }),
    1,
    async (_, batchIndex) => {
      const inicio = batchIndex * tamañoLote + 1;
      const lote = this.generarLote(inicio, tamañoLote);

      // Guardamos los datos para la tabla
      todosLosDatos.push(...lote);
    }
  );

  this.tableData.set(todosLosDatos);
}


}
