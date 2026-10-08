import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RolService } from '../../core/services/rol';
import { AuthService } from '../../core/services/auth';
import { RolDetalleDto, RolDto } from '../../core/models/rol.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { PermisosDialogComponent } from './permisos-dialog';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    InputText,
    Tag,
    Dialog,
    Message,
    Tooltip,
    PermisosDialogComponent
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class RolesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  readonly roles = signal<RolDto[]>([]);
  readonly cargando = signal(false);
  readonly controlBusqueda = new FormControl('', { nonNullable: true });

  readonly formVisible = signal(false);
  readonly editando = signal<RolDto | null>(null);
  form: FormGroup;
  readonly guardando = signal(false);
  readonly formError = signal('');

  readonly permisosVisible = signal(false);
  readonly rolPermisos = signal<RolDto | null>(null);

  readonly detalleVisible = signal(false);
  readonly detalle = signal<RolDetalleDto | null>(null);
  readonly detalleCargando = signal(false);

  constructor(
    private rolService: RolService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.form = new FormGroup({
      nombre: new FormControl('', [Validators.required, Validators.minLength(3)])
    });
  }

  ngOnInit(): void {
    this.controlBusqueda.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar());

    this.cargar();
  }

  get puedeCrear(): boolean {
    return this.authService.hasPermission('Roles.Crear');
  }

  get puedeEditar(): boolean {
    return this.authService.hasPermission('Roles.Editar');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('Roles.Eliminar');
  }

  get puedeAsignarPermisos(): boolean {
    return this.authService.hasPermission('Roles.AsignarPermisos');
  }

  get tituloForm(): string {
    return this.editando() ? 'Renombrar rol' : 'Nuevo rol';
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '' });
    this.formError.set('');
    this.formVisible.set(true);
  }

  abrirEditar(rol: RolDto): void {
    if (rol.esBase) {
      return;
    }

    this.editando.set(rol);
    this.form.reset({ nombre: rol.nombre });
    this.formError.set('');
    this.formVisible.set(true);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rol = this.editando();
    const nombre = (this.form.getRawValue() as { nombre: string }).nombre.trim();

    if (nombre.length === 0) {
      return;
    }

    this.guardando.set(true);
    this.formError.set('');

    const request = rol
      ? this.rolService.actualizar(rol.id, { nombre })
      : this.rolService.crear({ nombre });

    request.subscribe({
      next: () => {
        this.guardando.set(false);
        this.formVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: rol ? 'Rol actualizado' : 'Rol creado',
          detail: `El rol ${nombre} se guardó correctamente.`
        });
        this.cargar();
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.formError.set(mensajeDeError(err));
      }
    });
  }

  abrirPermisos(rol: RolDto): void {
    this.rolPermisos.set(rol);
    this.permisosVisible.set(true);
  }

  abrirDetalle(rol: RolDto): void {
    this.detalle.set(null);
    this.detalleCargando.set(true);
    this.detalleVisible.set(true);

    this.rolService.obtener(rol.id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.detalleCargando.set(false);
      },
      error: (err: unknown) => {
        this.detalleCargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar el rol',
          detail: mensajeDeError(err)
        });
        this.detalleVisible.set(false);
      }
    });
  }

  confirmarEliminar(rol: RolDto): void {
    if (rol.esBase) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Eliminar rol',
      message: `¿Desea eliminar el rol ${rol.nombre}?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.rolService.eliminar(rol.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Rol eliminado',
              detail: `El rol ${rol.nombre} se eliminó correctamente.`
            });
            this.cargar();
          },
          error: (err: unknown) => {
            this.messageService.add({
              severity: 'error',
              summary: 'No se pudo eliminar el rol',
              detail: mensajeDeError(err)
            });
          }
        });
      }
    });
  }

  private cargar(): void {
    this.cargando.set(true);

    this.rolService.listar(this.controlBusqueda.value).subscribe({
      next: (roles) => {
        this.roles.set(roles ?? []);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.roles.set([]);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los roles',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}