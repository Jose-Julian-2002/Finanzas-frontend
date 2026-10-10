import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MetodoPagoService } from '../../core/services/metodo-pago';
import { AuthService } from '../../core/services/auth';
import { MetodoPagoDto } from '../../core/models/metodo-pago.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { MetodoPagoFormDialogComponent } from './dialogs/metodo-pago-form-dialog';

@Component({
  selector: 'app-metodos-pago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Tooltip,
    Dialog,
    MetodoPagoFormDialogComponent
  ],
  templateUrl: './metodos-pago.html',
  styleUrl: './metodos-pago.css'
})
export class MetodosPagoComponent implements OnInit {
  readonly metodos = signal<MetodoPagoDto[]>([]);
  readonly cargando = signal(false);

  readonly formVisible = signal(false);
  readonly metodoEditando = signal<MetodoPagoDto | null>(null);

  readonly detalleVisible = signal(false);
  readonly detalleCargando = signal(false);
  readonly metodoDetalle = signal<MetodoPagoDto | null>(null);

  constructor(
    private metodoPagoService: MetodoPagoService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.cargar();
  }

  get puedeCrear(): boolean {
    return this.authService.hasPermission('MetodosPago.Crear');
  }

  get puedeEditar(): boolean {
    return this.authService.hasPermission('MetodosPago.Editar');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('MetodosPago.Eliminar');
  }

  abrirCrear(): void {
    this.metodoEditando.set(null);
    this.formVisible.set(true);
  }

  abrirEditar(metodo: MetodoPagoDto): void {
    this.metodoEditando.set(metodo);
    this.formVisible.set(true);
  }

  abrirDetalle(metodo: MetodoPagoDto): void {
    this.metodoDetalle.set(null);
    this.detalleCargando.set(true);
    this.detalleVisible.set(true);

    this.metodoPagoService.obtener(metodo.id).subscribe({
      next: (detalle) => {
        this.metodoDetalle.set(detalle);
        this.detalleCargando.set(false);
      },
      error: (err: unknown) => {
        this.detalleCargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar el metodo de pago',
          detail: mensajeDeError(err)
        });
        this.detalleVisible.set(false);
      }
    });
  }

  alGuardar(): void {
    this.cargar();
  }

  confirmarEliminar(metodo: MetodoPagoDto): void {
    this.confirmationService.confirm({
      header: 'Eliminar metodo de pago',
      message: metodo.totalPagos > 0
        ? `${metodo.nombre} tiene ${metodo.totalPagos} pagos registrados. No se puede eliminar.`
        : `¿Desea eliminar el metodo ${metodo.nombre}? Esta accion no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.metodoPagoService.eliminar(metodo.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Metodo eliminado',
              detail: `${metodo.nombre} se eliminó correctamente.`
            });
            this.cargar();
          },
          error: (err: unknown) => {
            this.messageService.add({
              severity: 'error',
              summary: 'No se pudo eliminar',
              detail: mensajeDeError(err)
            });
          }
        });
      }
    });
  }

  private cargar(): void {
    this.cargando.set(true);

    this.metodoPagoService.listar(false).subscribe({
      next: (metodos) => {
        this.metodos.set(metodos ?? []);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.metodos.set([]);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los metodos de pago',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}