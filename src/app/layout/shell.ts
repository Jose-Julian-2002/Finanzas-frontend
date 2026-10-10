import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { Drawer } from 'primeng/drawer';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Tooltip } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../core/services/auth';
import { ThemeService } from '../core/services/theme';
import { CambiarPasswordDialogComponent } from '../features/auth/cambiar-password/cambiar-password-dialog';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Button,
    Avatar,
    Drawer,
    Toast,
    ConfirmDialog,
    Tooltip,
    CambiarPasswordDialogComponent
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css'
})
export class ShellComponent {
  readonly themeService = inject(ThemeService);

  readonly passwordDialogVisible = signal(false);
  readonly drawerVisible = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    if (this.authService.debeCambiarPasswordInicial()) {
      this.passwordDialogVisible.set(true);
    }
  }

  get puedeVerClientes(): boolean {
    return this.authService.hasPermission('Clientes.Ver');
  }

  get puedeVerPrestamos(): boolean {
    return this.authService.hasPermission('Prestamos.Ver');
  }

  get puedeVerMetodosPago(): boolean {
    return this.authService.hasPermission('MetodosPago.Ver');
  }

  get puedeVerPagos(): boolean {
    return this.authService.hasPermission('Pagos.Ver');
  }

  get puedeVerContratos(): boolean {
    return this.authService.hasPermission('Contratos.Ver');
  }

  get puedeVerPropiedades(): boolean {
    return this.authService.hasPermission('Propiedades.Ver');
  }

  get puedeVerTiposPropiedad(): boolean {
    return this.authService.hasPermission('TiposPropiedad.Ver');
  }

  get puedeVerUsuarios(): boolean {
    return this.authService.hasPermission('Usuarios.Ver');
  }

  get puedeVerRoles(): boolean {
    return this.authService.hasPermission('Roles.Ver');
  }

  confirmarLogout(): void {
    this.confirmationService.confirm({
      header: 'Cerrar sesion',
      message: 'Desea salir del sistema?',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Salir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.drawerVisible.set(false);
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}