import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumenCobranza, CuotaCobranza, PagoAplicado } from '../core/models/cobranza.model';
import { formatoMonto } from '../core/utils/formato';

@Component({
  selector: 'app-cobranza-detalle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <dl class="resumen">
      <div><dt>Cobranza</dt><dd>{{ etiquetas[resumen.estadoCobranza] }}</dd></div>
      <div><dt>Total abonado</dt><dd>{{ monto(resumen.totalAbonado) }}</dd></div>
      <div><dt>Saldo pendiente</dt><dd>{{ monto(resumen.saldoPendiente) }}</dd></div>
      <div><dt>Cuotas vencidas</dt><dd>{{ resumen.cuotasVencidas }}</dd></div>
      <div><dt>Saldo vencido</dt><dd>{{ monto(resumen.saldoVencido) }}</dd></div>
      <div><dt>Atraso máximo</dt><dd>{{ resumen.diasAtrasoMax }} días</dd></div>
      <div><dt>Próximo vencimiento</dt><dd>{{ (resumen.proximoVencimiento | date:'dd/MM/yyyy') || '—' }}</dd></div>
    </dl>
    <h3>{{ titulo }}</h3>
    <div class="tabla-scroll" tabindex="0" [attr.aria-label]="titulo">
      <table>
        <thead><tr><th>Nº</th><th>Vencimiento</th><th>Monto</th><th>Abonado</th><th>Saldo</th><th>Estado</th><th>Completada</th><th>Días de atraso al pagar</th><th>Aplicaciones</th></tr></thead>
        <tbody>
          <tr *ngFor="let cuota of cuotas">
            <td>{{ cuota.numero }}</td><td>{{ cuota.vencimiento | date:'dd/MM/yyyy' }}</td>
            <td>{{ monto(cuota.monto) }}</td><td>{{ monto(cuota.abonado) }}</td><td>{{ monto(cuota.saldo) }}</td>
            <td>{{ etiquetas[cuota.estado] }}</td><td>{{ (cuota.fechaPagoCompletada | date:'dd/MM/yyyy') || '—' }}</td>
            <td>{{ cuota.diasAtrasoPago ?? '—' }}</td><td>{{ cuota.pagoDetalleIds.join(', ') || '—' }}</td>
          </tr>
          <tr *ngIf="!cuotas.length"><td colspan="9">No hay cuotas registradas.</td></tr>
        </tbody>
      </table>
    </div>
    <h3>Pagos aplicados</h3>
    <div class="tabla-scroll" tabindex="0" aria-label="Pagos aplicados">
      <table>
        <thead><tr><th>Recibo / aplicación</th><th>Fecha</th><th>Monto</th><th>Método</th><th>Usuario</th></tr></thead>
        <tbody>
          <tr *ngFor="let pago of pagos"><td>#{{ pago.pagoId }} / #{{ pago.pagoDetalleId }}</td><td>{{ pago.fecha | date:'dd/MM/yyyy' }}</td><td>{{ monto(pago.monto) }}</td><td>{{ pago.metodoPago }}</td><td>{{ pago.usuario }}</td></tr>
          <tr *ngIf="!pagos.length"><td colspan="5">No hay pagos aplicados.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .resumen { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 24px 0; }
    dt { color: var(--app-text-muted); font-size: var(--app-text-sm); }
    dd { margin: 4px 0 0; font-weight: 600; font-variant-numeric: tabular-nums; }
    h3 { margin: 24px 0 12px; font-size: var(--app-text-md); }
    .tabla-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: var(--app-text-sm); }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--app-border); white-space: nowrap; font-variant-numeric: tabular-nums; }
    th { color: var(--app-text-muted); }
  `
})
export class CobranzaDetalleComponent {
  @Input({ required: true }) resumen!: ResumenCobranza;
  @Input() cuotas: CuotaCobranza[] = [];
  @Input() pagos: PagoAplicado[] = [];
  @Input() titulo = 'Cuotas';
  readonly monto = formatoMonto;
  readonly etiquetas: Record<string, string> = {
    AlDia: 'Al día', Moroso: 'Moroso', Liquidado: 'Liquidado', Pendiente: 'Pendiente',
    Parcial: 'Parcial', Pagada: 'Pagada', PagadaAnticipada: 'Pagada anticipada',
    PagadaConAtraso: 'Pagada con atraso', Vencida: 'Vencida', VencidaParcial: 'Vencida parcial'
  };
}
