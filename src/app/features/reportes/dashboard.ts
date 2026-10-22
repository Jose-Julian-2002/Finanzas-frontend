import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardReporte, CobroReporte } from '../../core/models/reporte.model';
import { AuthService } from '../../core/services/auth';
import { formatoMonto } from '../../core/utils/formato';

export function rangoDashboard(periodo: string, ahora = new Date()): { desde: string; hasta: string } {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ahora);
  const parte = (tipo: string) => partes.find(p => p.type === tipo)!.value;
  const hasta = `${parte('year')}-${parte('month')}-${parte('day')}`;
  if (periodo === 'mes') return { desde: `${hasta.slice(0, 7)}-01`, hasta };
  const inicio = new Date(`${hasta}T12:00:00Z`);
  inicio.setUTCDate(inicio.getUTCDate() - Math.max(0, Number(periodo) - 1));
  return { desde: inicio.toISOString().slice(0, 10), hasta };
}

@Component({
  selector: 'app-dashboard', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html', styleUrl: './dashboard.css'
})
export class DashboardComponent {
  @Input() datos: DashboardReporte | null = null;
  @Input() cobros: CobroReporte[] = [];
  @Input() errorCobros = '';
  @Input() cargando = false;
  @Input() error = '';
  @Output() filtrar = new EventEmitter<{ desde: string; hasta: string }>();
  readonly auth = inject(AuthService);
  readonly monto = formatoMonto;
  periodo = 'mes';
  personalizado = rangoDashboard('mes');
  readonly rejilla = [0, 1, 2, 3, 4];
  cambiarPeriodo(valor: string): void {
    this.periodo = valor;
    if (valor !== 'personalizado') {
      this.personalizado = rangoDashboard(valor);
      this.filtrar.emit(this.personalizado);
    }
  }
  aplicarPersonalizado(): void { this.filtrar.emit({ ...this.personalizado }); }
  get meses() { return this.datos?.series.cobrosPorMes ?? []; }
  get techo(): number {
    const max = Math.max(0, ...this.meses.map(m => m.monto));
    if (!max) return 1;
    const escala = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / escala) * escala;
  }
  x(indice: number): number { return this.meses.length < 2 ? 349 : 90 + indice / (this.meses.length - 1) * 518; }
  y(valor: number): number { return 224 - Math.max(0, valor) / this.techo * 196; }
  get linea(): string { return this.meses.map((mes, i) => `${this.x(i)},${this.y(mes.monto)}`).join(' '); }
  get area(): string {
    return this.meses.length < 2 ? '' : `${this.x(0)},224 ${this.linea} ${this.x(this.meses.length - 1)},224`;
  }
  mostrarMes(indice: number): boolean {
    return indice === 0 || indice === this.meses.length - 1 || indice % Math.max(1, Math.ceil(this.meses.length / 6)) === 0;
  }
  mesCorto(mes: string): string {
    const fecha = new Date(`${mes.slice(0, 7)}-15T12:00:00Z`);
    return Number.isNaN(fecha.getTime()) ? mes : new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(fecha);
  }
  eje(valor: number): string { return new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 }).format(valor); }
  porcentaje(valor: number, total: number): number { return total > 0 ? Math.min(100, Math.max(0, valor / total * 100)) : 0; }
  get clientes() { return [...(this.datos?.series.topClientes ?? [])].sort((a, b) => b.monto - a.monto).slice(0, 5); }
  get maxCliente(): number { return Math.max(0, ...this.clientes.map(c => c.monto)); }
  get metodos() { return this.datos?.series.cobrosPorMetodo ?? []; }
  get totalMetodos(): number { return this.metodos.reduce((total, metodo) => total + metodo.monto, 0); }
}
