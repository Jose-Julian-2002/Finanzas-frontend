import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { RolService } from '../../core/services/rol';
import { PermisoService } from '../../core/services/permiso';
import { GrupoPermisos, PermisoDto } from '../../core/models/rol.model';
import { mensajeDeError } from '../../core/utils/api-error';

@Component({
  selector: 'app-permisos-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
    Button,
    InputText,
    Checkbox,
    Message
  ],
  templateUrl: './permisos-dialog.html',
  styleUrl: './permisos-dialog.css'
})
export class PermisosDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() rolId: number | null = null;
  @Input() rolNombre = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  readonly grupos = signal<GrupoPermisos[]>([]);
  readonly catalogo = signal<PermisoDto[]>([]);
  readonly seleccionados = signal<Set<number>>(new Set());
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorMessage = signal('');
  readonly controlBusqueda = signal('');
  readonly totalCatalogo = signal(0);

  constructor(
    private rolService: RolService,
    private permisoService: PermisoService,
    private messageService: MessageService
  ) { }

  ngOnChanges(): void {
    if (this.visible && this.rolId !== null) {
      this.cargar();
    }
  }

  get cantidadSeleccionados(): number {
    return this.seleccionados().size;
  }

  estaSeleccionado(permisoId: number): boolean {
    return this.seleccionados().has(permisoId);
  }

  grupoCompleto(grupo: GrupoPermisos): boolean {
    return grupo.permisos.every((p) => this.estaSeleccionado(p.id));
  }

  grupoParcial(grupo: GrupoPermisos): boolean {
    const marcados = grupo.permisos.filter((p) => this.estaSeleccionado(p.id)).length;
    return marcados > 0 && marcados < grupo.permisos.length;
  }

  alternar(permisoId: number): void {
    const siguiente = new Set(this.seleccionados());

    if (siguiente.has(permisoId)) {
      siguiente.delete(permisoId);
    } else {
      siguiente.add(permisoId);
    }

    this.seleccionados.set(siguiente);
  }

  alternarGrupo(grupo: GrupoPermisos): void {
    const siguiente = new Set(this.seleccionados());
    const completo = this.grupoCompleto(grupo);

    grupo.permisos.forEach((p) => {
      if (completo) {
        siguiente.delete(p.id);
      } else {
        siguiente.add(p.id);
      }
    });

    this.seleccionados.set(siguiente);
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  guardar(): void {
    const id = this.rolId;

    if (id === null) {
      return;
    }

    this.guardando.set(true);
    this.errorMessage.set('');

    this.rolService.asignarPermisos(id, { permisos: [...this.seleccionados()] }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.visibleChange.emit(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Permisos actualizados',
          detail: `Se guardaron ${this.cantidadSeleccionados} permisos para ${this.rolNombre}.`
        });
        this.guardado.emit();
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.errorMessage.set(mensajeDeError(err));
      }
    });
  }

  private cargar(): void {
    const id = this.rolId;

    if (id === null) {
      return;
    }

    this.cargando.set(true);
    this.errorMessage.set('');
    this.controlBusqueda.set('');

    forkJoin({
      catalogo: this.permisoService.listar(),
      asignados: this.rolService.listarPermisosDeRol(id)
    }).subscribe({
      next: ({ catalogo, asignados }) => {
        this.catalogo.set(catalogo ?? []);
        this.grupos.set(this.agruparPorModulo(catalogo ?? []));
        this.seleccionados.set(new Set(asignados ?? []));
        this.totalCatalogo.set((catalogo ?? []).length);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.catalogo.set([]);
        this.grupos.set([]);
        this.seleccionados.set(new Set());
        this.cargando.set(false);
        this.errorMessage.set(mensajeDeError(err));
      }
    });
  }

  private agruparPorModulo(permisos: PermisoDto[]): GrupoPermisos[] {
    const mapa = new Map<string, PermisoDto[]>();

    permisos
      .filter((p) => this.coincideBusqueda(p))
      .forEach((p) => {
        const lista = mapa.get(p.modulo) ?? [];
        lista.push(p);
        mapa.set(p.modulo, lista);
      });

    return [...mapa.entries()]
      .map(([modulo, items]) => ({ modulo, permisos: items }))
      .sort((a, b) => a.modulo.localeCompare(b.modulo, 'es'));
  }

  private coincideBusqueda(permiso: PermisoDto): boolean {
    const texto = this.controlBusqueda().trim().toLowerCase();

    if (texto.length === 0) {
      return true;
    }

    return permiso.nombre.toLowerCase().includes(texto) ||
      (permiso.descripcion ?? '').toLowerCase().includes(texto);
  }

  onBuscar(texto: string): void {
    this.controlBusqueda.set(texto);
    this.grupos.set(this.agruparPorModulo(this.catalogo()));
  }
}