import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, Observable, switchMap, map, catchError, of } from 'rxjs';
import { DashboardComponent, rangoDashboard } from './dashboard';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { ReporteService } from '../../core/services/reporte';
import { DatosFinancierosService } from '../../core/services/datos-financieros';
import { DashboardReporte, CobroReporte, FilaReporte, TipoReporte, ReporteFiltros } from '../../core/models/reporte.model';
import { PaginatedResponse } from '../../core/models/common.model';
import { OPCIONES_COBRANZA } from '../../core/models/cobranza.model';
import { ReporteTablaComponent, etiquetaReporte } from '../../shared/reporte-tabla';
import { formatoMonto } from '../../core/utils/formato';
import { mensajeDeError } from '../../core/utils/api-error';

@Component({
  selector: 'app-reportes', standalone: true,
  imports: [DashboardComponent, CommonModule, FormsModule, RouterLink, RouterLinkActive, Button, Select, Paginator, ReporteTablaComponent],
  templateUrl: './reportes.html', styleUrl: './reportes.css'
})
export class ReportesComponent implements OnInit {
  private readonly service = inject(ReporteService);
  private readonly cambios = inject(DatosFinancierosService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private peticion?: Subscription;
  readonly tipo = signal<TipoReporte>('Dashboard');
  readonly dashboard = signal<DashboardReporte | null>(null);
  readonly cobrosDashboard = signal<CobroReporte[]>([]);
  readonly errorCobrosDashboard = signal('');
  readonly filas = signal<FilaReporte[]>([]);
  readonly cobros = signal<CobroReporte[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly opcionesCobranza = OPCIONES_COBRANZA;
  readonly monto = formatoMonto;
  readonly etiqueta = etiquetaReporte;
  readonly secciones = [
    { ruta: 'dashboard', titulo: 'Dashboard' }, { ruta: 'cobros', titulo: 'Cobros' },
    { ruta: 'prestamos', titulo: 'Préstamos' }, { ruta: 'contratos', titulo: 'Contratos' }
  ];
  filtros: ReporteFiltros = { estadoCobranza: 'Todos', pagina: 1, tamano: 50, soloActivos: true };
  constructor() { this.destroyRef.onDestroy(() => this.peticion?.unsubscribe()); }
  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    for (const clave of ['desde', 'hasta'] as const) {
      const valor = query.get(clave);
      if (valor && /^\d{4}-\d{2}-\d{2}$/.test(valor)) this.filtros[clave] = valor;
    }
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.tipo.set(data['tipo'] as TipoReporte);
      if (this.tipo() === 'Dashboard' && !this.filtros.desde) Object.assign(this.filtros, rangoDashboard('mes'));
      this.dashboard.set(null);
      this.aplicar();
    });
    this.cambios.cambios$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cargar());
  }
  get titulo(): string { return this.tipo() === 'Prestamos' ? 'Préstamos' : this.tipo(); }
  get primer(): number { return ((this.filtros.pagina ?? 1) - 1) * (this.filtros.tamano ?? 50); }
  aplicar(): void { this.filtros.pagina = 1; this.cargar(); }
  filtrarDashboard(rango: { desde: string; hasta: string }): void {
    Object.assign(this.filtros, rango);
    this.aplicar();
  }
  paginar(event: PaginatorState): void {
    this.filtros.tamano = Math.min(event.rows ?? 50, 500);
    this.filtros.pagina = Math.floor((event.first ?? 0) / this.filtros.tamano) + 1;
    this.cargar();
  }
  registros(datos: object[]): FilaReporte[] { return datos.map(item => ({ ...item })); }
  indicadores(datos: object): [string, unknown][] { return Object.entries(datos).filter(([clave]) => clave !== 'detalle'); }
  valorIndicador(clave: string, valor: unknown): string {
    return /saldo|cobrado/i.test(clave) ? this.monto(Number(valor)) : Number(valor).toLocaleString('es-BO');
  }
  private cargar(): void {
    this.peticion?.unsubscribe();
    this.error.set('');
    if (this.filtros.desde && this.filtros.hasta && this.filtros.desde > this.filtros.hasta) {
      this.error.set('La fecha inicial debe ser anterior o igual a la fecha final.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.filas.set([]);
    this.cobros.set([]);
    this.total.set(0);
    if (this.tipo() === 'Dashboard') {
      this.dashboard.set(null);
      this.cobrosDashboard.set([]);
      this.errorCobrosDashboard.set('');
      this.peticion = this.service.dashboard(this.filtros).pipe(
        switchMap(data => this.service.cobros({ desde: data.desde.slice(0, 10), hasta: data.hasta.slice(0, 10), pagina: 1, tamano: 5 }).pipe(
          map(recientes => ({ data, cobros: recientes.items, error: '' })),
          catchError(err => of({ data, cobros: [] as CobroReporte[], error: mensajeDeError(err) }))
        ))
      ).subscribe({
        next: resultado => {
          this.dashboard.set(resultado.data);
          this.cobrosDashboard.set(resultado.cobros);
          this.errorCobrosDashboard.set(resultado.error);
          this.cargando.set(false);
        },
        error: err => { this.error.set(mensajeDeError(err)); this.cargando.set(false); }
      });
      return;
    }
    const peticion: Observable<PaginatedResponse<object>> = this.tipo() === 'Cobros' ? this.service.cobros(this.filtros)
      : this.tipo() === 'Prestamos' ? this.service.prestamos(this.filtros) : this.service.contratos(this.filtros);
    this.peticion = peticion.subscribe({
      next: data => {
        this.filas.set(this.registros(data.items ?? []));
        if (this.tipo() === 'Cobros') this.cobros.set(data.items as CobroReporte[]);
        this.total.set(data.total);
        this.cargando.set(false);
      },
      error: err => { this.error.set(mensajeDeError(err)); this.cargando.set(false); }
    });
  }
}
