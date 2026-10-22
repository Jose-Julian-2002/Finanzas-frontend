import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilaReporte } from '../core/models/reporte.model';
import { formatoMonto } from '../core/utils/formato';

export function etiquetaReporte(clave: string): string {
  const etiquetas: Record<string, string> = {
    totalCobrado: 'Total cobrado', saldoPorCobrar: 'Saldo por cobrar', recibos: 'Recibos',
    clientesActivos: 'Clientes activos', prestamosActivos: 'Préstamos activos', contratosActivos: 'Contratos activos',
    obligacionesMorosas: 'Obligaciones morosas', prestamosMorosos: 'Préstamos morosos', contratosMorosos: 'Contratos morosos',
    saldoVencidoPrestamos: 'Saldo vencido de préstamos', saldoVencidoContratos: 'Saldo vencido de contratos', saldoVencidoTotal: 'Saldo vencido total',
    diasAtrasoMax: 'Atraso máximo (días)', AlDia: 'Al día', Moroso: 'Moroso', Liquidado: 'Liquidado'
  };
  const texto = etiquetas[clave] ?? clave.replace(/([a-z])([A-Z])/g, '$1 $2');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

@Component({
  selector: 'app-reporte-tabla', standalone: true, imports: [CommonModule],
  template: `
    <div class="tabla-scroll" tabindex="0" [attr.aria-label]="titulo">
      <table *ngIf="filas.length; else vacio">
        <caption>{{ titulo }}</caption>
        <thead><tr><th *ngFor="let columna of columnas" scope="col">{{ etiqueta(columna) }}</th></tr></thead>
        <tbody><tr *ngFor="let fila of filas"><td *ngFor="let columna of columnas">{{ valor(fila[columna], columna) }}</td></tr></tbody>
      </table>
      <ng-template #vacio><p class="estado-vacio">No hay datos para los filtros seleccionados.</p></ng-template>
    </div>
  `,
  styles: `
    .tabla-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: var(--app-text-sm); }
    caption { text-align: left; font-weight: 600; padding-bottom: 12px; }
    th, td { padding: 12px; border-bottom: 1px solid var(--app-border); text-align: left; white-space: nowrap; font-variant-numeric: tabular-nums; }
    th { color: var(--app-text-muted); }
  `
})
export class ReporteTablaComponent {
  @Input() filas: FilaReporte[] = [];
  @Input() titulo = 'Resultados';
  get columnas(): string[] { return [...new Set(this.filas.flatMap(fila => Object.keys(fila)))]; }
  readonly etiqueta = etiquetaReporte;
  valor(valor: unknown, columna: string): string {
    if (valor === null || valor === undefined) return '—';
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (typeof valor === 'number') return /monto|saldo|abonado|capital|alquiler|cobrado|garantia|intereses|cuotaMensual|totalPagar/i.test(columna) ? formatoMonto(valor) : valor.toLocaleString('es-BO');
    if (typeof valor === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10).split('-').reverse().join('/');
      return ['AlDia', 'Moroso', 'Liquidado'].includes(valor) ? etiquetaReporte(valor) : valor;
    }
    return JSON.stringify(valor);
  }
}
