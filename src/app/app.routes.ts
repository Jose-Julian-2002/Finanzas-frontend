import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
      {
        path: 'clientes',
        canActivate: [permissionGuard('Clientes.Ver')],
        loadComponent: () => import('./features/clientes/clientes').then((m) => m.ClientesComponent)
      },
      {
        path: 'prestamos',
        canActivate: [permissionGuard('Prestamos.Ver')],
        loadComponent: () => import('./features/prestamos/prestamos').then((m) => m.PrestamosComponent)
      },
      {
        path: 'pagos',
        canActivate: [permissionGuard('Pagos.Ver')],
        loadComponent: () => import('./features/pagos/pagos').then((m) => m.PagosComponent)
      },
      {
        path: 'contratos',
        canActivate: [permissionGuard('Contratos.Ver')],
        loadComponent: () => import('./features/contratos/contratos').then((m) => m.ContratosComponent)
      },
      {
        path: 'propiedades',
        canActivate: [permissionGuard('Propiedades.Ver')],
        loadComponent: () =>
          import('./features/propiedades/propiedades').then((m) => m.PropiedadesComponent)
      },
      {
        path: 'tipos-propiedad',
        canActivate: [permissionGuard('TiposPropiedad.Ver')],
        loadComponent: () =>
          import('./features/tipos-propiedad/tipos-propiedad').then(
            (m) => m.TiposPropiedadComponent
          )
      },
      {
        path: 'metodos-pago',
        canActivate: [permissionGuard('MetodosPago.Ver')],
        loadComponent: () =>
          import('./features/metodos-pago/metodos-pago').then((m) => m.MetodosPagoComponent)
      },
      {
        path: 'usuarios',
        canActivate: [permissionGuard('Usuarios.Ver')],
        loadComponent: () =>
          import('./features/usuarios/usuarios').then((m) => m.UsuariosComponent)
      },
      {
        path: 'roles',
        canActivate: [permissionGuard('Roles.Ver')],
        loadComponent: () => import('./features/roles/roles').then((m) => m.RolesComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];