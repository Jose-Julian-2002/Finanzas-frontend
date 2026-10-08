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

interface NavItem {
  label: string;
  icono: string;
  ruta: string;
  permiso: string;
}

interface NavSection {
  id: string;
  titulo: string;
  items: NavItem[];
}

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

  /**
   * Navegacion agrupada por secciones. Al sumar modulos (Prestamos, Pagos)
   * basta con anadir el item en su seccion: el filtro por permisos y los
   * titulos se resuelven solos.
   */
  readonly navSections: NavSection[] = [
    {
      id: 'cartera',
      titulo: 'Cartera',
      items: [
        { label: 'Clientes', icono: 'pi pi-users', ruta: '/clientes', permiso: 'Clientes.Ver' }
      ]
    },
    {
      id: 'catalogo',
      titulo: 'Catalogo',
      items: [
        {
          label: 'Propiedades',
          icono: 'pi pi-building',
          ruta: '/propiedades',
          permiso: 'Propiedades.Ver'
        },
        {
          label: 'Tipos de propiedad',
          icono: 'pi pi-tags',
          ruta: '/tipos-propiedad',
          permiso: 'TiposPropiedad.Ver'
        }
      ]
    },
    {
      id: 'administrador',
      titulo: 'Administrador',
      items: [
        {
          label: 'Usuarios',
          icono: 'pi pi-id-card',
          ruta: '/usuarios',
          permiso: 'Usuarios.Ver'
        },
        { label: 'Roles', icono: 'pi pi-shield', ruta: '/roles', permiso: 'Roles.Ver' }
      ]
    }
  ];

  constructor(
    public authService: AuthService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    if (this.authService.debeCambiarPasswordInicial()) {
      this.passwordDialogVisible.set(true);
    }
  }

  /** Secciones con items visibles para el rol actual. Las vacias se descartan. */
  get navVisible(): NavSection[] {
    return this.navSections
      .map((seccion) => ({
        ...seccion,
        items: seccion.items.filter((item) => this.authService.hasPermission(item.permiso))
      }))
      .filter((seccion) => seccion.items.length > 0);
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