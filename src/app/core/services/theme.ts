import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

export type Tema = 'oscuro' | 'claro';

const CLAVE = 'app_tema';

/** Dark is the default: an operations console is read in low ambient light. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly tema = signal<Tema>(this.leer());
  readonly esOscuro = computed(() => this.tema() === 'oscuro');
  readonly iconoTema = computed(() => (this.esOscuro() ? 'pi pi-sun' : 'pi pi-moon'));
  readonly etiquetaTema = computed(() =>
    this.esOscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
  );

  constructor() {
    this.aplicar();
  }

  alternar(): void {
    this.set(this.tema() === 'oscuro' ? 'claro' : 'oscuro');
  }

  set(tema: Tema): void {
    this.tema.set(tema);
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      // Modo privado o storage bloqueado: el tema igual funciona en memoria.
    }
    this.aplicar();
  }

  private leer(): Tema {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === 'oscuro' || guardado === 'claro') {
        return guardado;
      }
    } catch {
      // Sin storage disponible, usamos el default.
    }
    return 'oscuro';
  }

  private aplicar(): void {
    const html = this.document.documentElement;

    if (this.esOscuro()) {
      html.classList.add('app-dark');
    } else {
      html.classList.remove('app-dark');
    }

    const meta = this.document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', this.esOscuro() ? '#0d1424' : '#f4f6fb');
  }
}