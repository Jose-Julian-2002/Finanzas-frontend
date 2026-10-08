import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TipoPropiedadService } from '../../core/services/tipo-propiedad';
import { AuthService } from '../../core/services/auth';
import { TipoPropiedadDto } from '../../core/models/tipo-propiedad.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { TipoPropiedadFormDialogComponent } from './dialogs/tipo-propiedad-form-dialog';

@Component({
  selector: 'app-tipos-propiedad',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    InputText,
    Tooltip,
    Dialog,
    TipoPropiedadFormDialogComponent
  ],
  templateUrl: './tipos-propiedad.html',
  styleUrl: './tipos-propiedad.css'
})
export class TiposPropiedadComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  readonly controlBusqueda = new FormControl('', { nonNullable: true });

  readonly tipos = signal<TipoPropiedadDto[]>([]);
  readonly cargando = signal(false);

  readonly formVisible = signal(false);
  readonly tipoEditando = signal<TipoPropiedadDto | null>(null);

  readonly detalleVisible = signal(false);
  readonly detalleCargando = signal(false);
  readonly tipoDetalle = signal<TipoPropiedadDto | null>(null);

  constructor(
    private tipoPropiedadService: TipoPropiedadService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.controlBusqueda.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar());

    this.cargar();
  }

  get puedeCrear(): boolean {
    return this.authService.hasPermission('TiposPropiedad.Crear');
  }

  get puedeEditar(): boolean {
    return this.authService.hasPermission('TiposPropiedad.Editar');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('TiposPropiedad.Eliminar');
  }

  abrirCrear(): void {
    this.tipoEditando.set(null);
    this.formVisible.set(true);
  }

  abrirEditar(tipo: TipoPropiedadDto): void {
    this.tipoEditando.set(tipo);
    this.formVisible.set(true);
  }

  abrirDetalle(tipo: TipoPropiedadDto): void {
    this.tipoDetalle.set(null);
    this.detalleCargando.set(true);
    this.detalleVisible.set(true);

    this.tipoPropiedadService.obtener(tipo.id).subscribe({
      next: (detalle) => {
        this.tipoDetalle.set(detalle);
        this.detalleCargando.set(false);
      },
      error: (err: unknown) => {
        this.detalleCargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar el tipo de propiedad',
          detail: mensajeDeError(err)
        });
        this.detalleVisible.set(false);
      }
    });
  }

  alGuardar(): void {
    this.cargar();
  }

  confirmarEliminar(tipo: TipoPropiedadDto): void {
    this.confirmationService.confirm({
      header: 'Eliminar tipo de propiedad',
      message: tipo.totalPropiedades > 0
        ? `${tipo.nombre} tiene ${tipo.totalPropiedades} propiedades asociadas. No se puede eliminar: reasigne o elimine esas propiedades primero.`
        : `¿Desea eliminar el tipo ${tipo.nombre}? Esta accion no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.tipoPropiedadService.eliminar(tipo.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Tipo eliminado',
              detail: `${tipo.nombre} se eliminó correctamente.`
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

    this.tipoPropiedadService.listar(this.controlBusqueda.value).subscribe({
      next: (tipos) => {
        this.tipos.set(tipos ?? []);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.tipos.set([]);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los tipos de propiedad',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}