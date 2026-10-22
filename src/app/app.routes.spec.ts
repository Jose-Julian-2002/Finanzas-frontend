import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, Routes, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { AuthService } from './core/services/auth';

@Component({ standalone: true, template: 'Página de prueba' })
class PaginaPrueba {}

@Component({ standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
class ShellPrueba {}

// Mantiene rutas y guards reales, sustituyendo solo las pantallas para aislar
// la navegación de formularios y peticiones de datos financieros.
const rutasPrueba: Routes = routes.map(ruta => ruta.children ? {
  ...ruta,
  loadComponent: () => Promise.resolve(ShellPrueba),
  children: ruta.children.map(hija => hija.loadComponent ? { ...hija, loadComponent: () => Promise.resolve(PaginaPrueba) } : hija)
} : ruta.loadComponent ? { ...ruta, loadComponent: () => Promise.resolve(PaginaPrueba) } : ruta);

describe('Navegación inicial y reportes', () => {
  let conSesion = false;
  let puedeVerReportes = true;
  beforeEach(() => {
    conSesion = false;
    puedeVerReportes = true;
    TestBed.configureTestingModule({ providers: [provideRouter(rutasPrueba), {
      provide: AuthService,
      useValue: { isLoggedIn: () => conSesion, hasPermission: () => puedeVerReportes }
    }] });
  });
  it('abre Login al entrar sin sesión y protege los accesos directos', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/login');
    await harness.navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/login');
    await harness.navigateByUrl('/reportes/contratos');
    expect(TestBed.inject(Router).url).toBe('/login');
  });
  it('con sesión inicia en Dashboard y evita volver a Login', async () => {
    conSesion = true;
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
    await harness.navigateByUrl('/login');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
  it('redirige el enlace antiguo del dashboard y abre Reportes en Cobros', async () => {
    conSesion = true;
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reportes/dashboard');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
    await harness.navigateByUrl('/reportes');
    expect(TestBed.inject(Router).url).toBe('/reportes/cobros');
    await harness.navigateByUrl('/reportes/prestamos');
    expect(TestBed.inject(Router).url).toBe('/reportes/prestamos');
  });
  it('no crea un bucle si el usuario no tiene permiso de reportes', async () => {
    conSesion = true;
    puedeVerReportes = false;
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reportes/cobros');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
