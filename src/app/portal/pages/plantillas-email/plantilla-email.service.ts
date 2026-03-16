import { Injectable } from '@angular/core';
import { PlantillaEmail } from './plantilla-email.interface';

const STORAGE_KEY = 'mogensen-plantillas-email';

@Injectable({ providedIn: 'root' })
export class PlantillaEmailService {
  getAll(): PlantillaEmail[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw) as PlantillaEmail[];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  getById(id: string): PlantillaEmail | null {
    return this.getAll().find((p) => p.id === id) ?? null;
  }

  create(data: Omit<PlantillaEmail, 'id'>): PlantillaEmail {
    const list = this.getAll();
    const id = `plantilla-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const nueva: PlantillaEmail = { ...data, id };
    list.push(nueva);
    this.save(list);
    return nueva;
  }

  update(id: string, data: Partial<Omit<PlantillaEmail, 'id'>>): PlantillaEmail | null {
    const list = this.getAll();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    this.save(list);
    return list[idx];
  }

  delete(id: string): boolean {
    const list = this.getAll().filter((p) => p.id !== id);
    if (list.length === this.getAll().length) return false;
    this.save(list);
    return true;
  }

  private save(list: PlantillaEmail[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}
