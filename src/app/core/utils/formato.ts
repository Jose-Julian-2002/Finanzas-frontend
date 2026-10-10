/**
 * Formato de moneda en pesos colombianos sin registrar el locale de Angular.
 * Intl ya viene en el navegador, asi que no hace falta LOCALE_ID.
 */
const FORMATEADOR_MONTO = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

export function formatoMonto(valor: number | null | undefined): string {
  return FORMATEADOR_MONTO.format(valor ?? 0);
}

const DOS_DIGITOS = (n: number): string => n.toString().padStart(2, '0');

/** Date local -> 'yyyy-MM-dd', que es lo que espera el backend. */
export function fechaParaApi(fecha: Date | null | undefined): string | null {
  if (!fecha) {
    return null;
  }
  return `${fecha.getFullYear()}-${DOS_DIGITOS(fecha.getMonth() + 1)}-${DOS_DIGITOS(fecha.getDate())}`;
}

/**
 * 'yyyy-MM-dd' -> Date local. Se evita `new Date(texto)` porque interpreta
 * la fecha como UTC y en Colombia (UTC-5) mostraria el dia anterior.
 */
export function fechaDesdeApi(texto: string | null | undefined): Date | null {
  if (!texto) {
    return null;
  }

  const soloFecha = texto.slice(0, 10).split('-');
  if (soloFecha.length !== 3) {
    return null;
  }

  const [anio, mes, dia] = soloFecha.map(Number);
  if (!anio || !mes || !dia) {
    return null;
  }

  return new Date(anio, mes - 1, dia);
}
