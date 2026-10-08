import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClienteService } from '../../core/services/cliente';
import { AuthService } from '../../core/services/auth';
import { ClienteDto } from '../../core/models/cliente.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { ClienteFormDialogComponent } from './dialogs/cliente-form-dialog';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    InputText,
    ToggleSwitch,
    Tooltip,
    Dialog,
    ClienteFormDialogComponent
  ],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class ClientesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  readonly controlBusqueda = new FormControl('', { nonNullable: true });

  readonly clientes = signal<ClienteDto[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly primer = signal(0);
  readonly tamano = signal(20);
  readonly soloActivos = signal(true);

  readonly formVisible = signal(false);
  readonly clienteEditando = signal<ClienteDto | null>(null);

  readonly detalleVisible = signal(false);
  readonly detalleCargando = signal(false);
  readonly clienteDetalle = signal<ClienteDto | null>(null);

  constructor(
    private clienteService: ClienteService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.controlBusqueda.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recargar());

    this.cargar();
  }

  get paginaActual(): number {
    return Math.floor(this.primer() / this.tamano()) + 1;
  }

  get puedeCrear(): boolean {
    return this.authService.hasPermission('Clientes.Crear');
  }

  get puedeEditar(): boolean {
    return this.authService.hasPermission('Clientes.Editar');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('Clientes.Eliminar');
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.primer.set(event.first ?? 0);
    this.tamano.set(event.rows ?? 20);
    this.cargar();
  }

  onCambiarSoloActivos(valor: boolean): void {
    this.soloActivos.set(valor);
    this.recargar();
  }

  abrirCrear(): void {
    this.clienteEditando.set(null);
    this.formVisible.set(true);
  }

  abrirEditar(cliente: ClienteDto): void {
    this.clienteEditando.set(cliente);
    this.formVisible.set(true);
  }

  onCambiarEstado(cliente: ClienteDto, activo: boolean): void {
    this.clienteService.cambiarEstado(cliente.id, activo).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `${cliente.nombre} quedó ${activo ? 'activo' : 'inactivo'}.`
        });
        this.cargar();
      },
      error: (err: unknown) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo actualizar el estado',
          detail: mensajeDeError(err)
        });
        this.cargar();
      }
    });
  }

  confirmarEliminar(cliente: ClienteDto): void {
    this.confirmationService.confirm({
      header: 'Desactivar cliente',
      message: `¿Desea desactivar a ${cliente.nombre}? El registro se conserva en la base de datos.`,
      icon: 'pi pi-ban',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.clienteService.eliminar(cliente.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Cliente desactivado',
              detail: `${cliente.nombre} ya no aparece en los listados activos.`
            });
            this.cargar();
          },
          error: (err: unknown) => {
            this.messageService.add({
              severity: 'error',
              summary: 'No se pudo desactivar',
              detail: mensajeDeError(err)
            });
          }
        });
      }
    });
  }

  abrirDetalle(cliente: ClienteDto): void {
    this.clienteDetalle.set(null);
    this.detalleCargando.set(true);
    this.detalleVisible.set(true);

    this.clienteService.obtener(cliente.id).subscribe({
      next: (detalle) => {
        this.clienteDetalle.set(detalle);
        this.detalleCargando.set(false);
      },
      error: (err: unknown) => {
        this.detalleCargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar el cliente',
          detail: mensajeDeError(err)
        });
        this.detalleVisible.set(false);
      }
    });
  }

  alGuardar(): void {
    this.cargar();
  }

  private recargar(): void {
    this.primer.set(0);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);

    this.clienteService.listar({
      buscar: this.controlBusqueda.value,
      pagina: this.paginaActual,
      tamano: this.tamano(),
      soloActivos: this.soloActivos()
    }).subscribe({
      next: (res) => {
        this.clientes.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.clientes.set([]);
        this.total.set(0);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los clientes',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}