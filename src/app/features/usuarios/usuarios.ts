import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RolService } from '../../core/services/rol';
import { RolDto } from '../../core/models/rol.model';
import { UsuarioService } from '../../core/services/usuario';
import { AuthService } from '../../core/services/auth';
import { UsuarioDto } from '../../core/models/usuario.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { UsuarioFormDialogComponent } from './dialogs/usuario-form-dialog';
import { CambiarPasswordDialogComponent } from '../auth/cambiar-password/cambiar-password-dialog';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    InputText,
    Select,
    Tag,
    ToggleSwitch,
    Tooltip,
    Dialog,
    UsuarioFormDialogComponent,
    CambiarPasswordDialogComponent
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  readonly roles = signal<RolDto[]>([]);
  readonly controlBusqueda = new FormControl('', { nonNullable: true });

  readonly usuarios = signal<UsuarioDto[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly primer = signal(0);
  readonly tamano = signal(20);
  readonly soloActivos = signal(true);
  readonly rolIdFiltro = signal<number | null>(null);

  readonly formVisible = signal(false);
  readonly usuarioEditando = signal<UsuarioDto | null>(null);

  readonly rolVisible = signal(false);
  readonly usuarioRol = signal<UsuarioDto | null>(null);
  readonly nuevoRolId = signal<number | null>(null);

  readonly passwordVisible = signal(false);
  readonly passwordUsuarioId = signal<number | null>(null);

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.controlBusqueda.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recargar());

    this.cargarRoles();
    this.cargar();
  }

  nombreDeRol(rolId: number): string {
    return this.roles().find((r) => r.id === rolId)?.nombre ?? 'Sin rol';
  }

  get paginaActual(): number {
    return Math.floor(this.primer() / this.tamano()) + 1;
  }

  get puedeCrear(): boolean {
    return this.authService.hasPermission('Usuarios.Crear');
  }

  get puedeEditar(): boolean {
    return this.authService.hasPermission('Usuarios.Editar');
  }

  get puedeGestionarRoles(): boolean {
    return this.authService.hasPermission('Usuarios.GestionarRoles');
  }

  severityRol(rol: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (rol) {
      case 'Administrador':
        return 'danger';
      case 'Cobrador':
        return 'info';
      case 'Cliente':
        return 'success';
      default:
        return 'secondary';
    }
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

  onCambiarRol(valor: number | null): void {
    this.rolIdFiltro.set(valor);
    this.recargar();
  }

  limpiarBusqueda(): void {
    this.controlBusqueda.setValue('', { emitEvent: false });
    this.recargar();
  }

  abrirCrear(): void {
    this.usuarioEditando.set(null);
    this.formVisible.set(true);
  }

  abrirEditar(usuario: UsuarioDto): void {
    this.usuarioEditando.set(usuario);
    this.formVisible.set(true);
  }

  alGuardar(): void {
    this.cargar();
  }

  abrirCambioRol(usuario: UsuarioDto): void {
    this.usuarioRol.set(usuario);
    this.nuevoRolId.set(usuario.rolId);
    this.rolVisible.set(true);
  }

  confirmarCambioRol(): void {
    const usuario = this.usuarioRol();
    const rolId = this.nuevoRolId();

    if (!usuario || rolId === null) {
      return;
    }

    this.usuarioService.cambiarRol(usuario.id, rolId).subscribe({
      next: () => {
        this.rolVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Rol actualizado',
          detail: `${usuario.nombre} ahora tiene el rol ${this.nombreDeRol(rolId)}.`
        });
        this.cargar();
      },
      error: (err: unknown) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cambiar el rol',
          detail: mensajeDeError(err)
        });
      }
    });
  }

  abrirCambioPassword(usuario: UsuarioDto): void {
    this.passwordUsuarioId.set(usuario.id);
    this.passwordVisible.set(true);
  }

  onCambiarEstado(usuario: UsuarioDto, activo: boolean): void {
    this.usuarioService.cambiarEstado(usuario.id, activo).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `${usuario.nombre} quedó ${activo ? 'activo' : 'inactivo'}.`
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

  confirmarEliminar(usuario: UsuarioDto): void {
    this.confirmationService.confirm({
      header: 'Desactivar usuario',
      message: `¿Desea desactivar a ${usuario.nombre}? El registro se conserva en la base de datos.`,
      icon: 'pi pi-ban',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.usuarioService.eliminar(usuario.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Usuario desactivado',
              detail: `${usuario.nombre} ya no puede iniciar sesión.`
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

  private cargarRoles(): void {
    this.rolService.listar().subscribe({
      next: (roles) => this.roles.set(roles ?? []),
      error: (err: unknown) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los roles',
          detail: mensajeDeError(err)
        });
      }
    });
  }

  private recargar(): void {
    this.primer.set(0);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);

    this.usuarioService.listar({
      buscar: this.controlBusqueda.value,
      pagina: this.paginaActual,
      tamano: this.tamano(),
      soloActivos: this.soloActivos(),
      rolId: this.rolIdFiltro()
    }).subscribe({
      next: (res) => {
        this.usuarios.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.usuarios.set([]);
        this.total.set(0);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los usuarios',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}