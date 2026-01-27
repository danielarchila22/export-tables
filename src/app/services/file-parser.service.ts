import { Injectable } from '@angular/core';
import { DataRecord } from '../models/user.model';

/*clase utilizable en multitarea-com*/
@Injectable({
  providedIn: 'root'
})
export class FileParserService {

  async parseJsonFile(file: File): Promise<DataRecord[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
              /*Api, leer archivos */

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const data = JSON.parse(text);

          // Manejar array directo u objeto con propiedad array
          let records: DataRecord[];

          if (Array.isArray(data)) {
            records = data;
          } else if (typeof data === 'object' && data !== null) {
            // Buscar la primera propiedad que sea un array
            const arrayProp = Object.keys(data).find(
              key => Array.isArray(data[key])
            );
            if (arrayProp) {
              records = data[arrayProp];
            } else {
              throw new Error('No se encontró un array en el JSON.');
            }
          } else {
            throw new Error('Estructura JSON inválida.');
          }

          resolve(records);
        } catch (error) {
          reject(new Error(`Error al parsear: ${(error as Error).message}`));
        }
      };

      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsText(file);
    });
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file.name.toLowerCase().endsWith('.json')) {
      return { valid: false, error: 'Por favor sube un archivo JSON' };
    }
    if (file.size > 500 * 1024 * 1024) {
      return { valid: false, error: 'El archivo excede 500MB' };
    }
    return { valid: true };
  }
}
