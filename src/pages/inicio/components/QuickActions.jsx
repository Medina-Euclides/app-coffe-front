// Accesos rápidos de Inicio: dos botones grandes (pesaje y jornada) y tres teclas
// compactas (venta, gasto y trabajador). Cada uno abre su formulario sobre Inicio.
import { ClipboardList, HandCoins, ReceiptText, Scale, UserPlus } from 'lucide-react';
import IconBadge from '#components/shared/IconBadge';
import { cargarFormularioMovimiento, tipoMovimiento } from '../quickForms.js';

// Las dos acciones del día en campo: botones grandes, uno al lado del otro.
// El borde inferior más oscuro les da relieve de tecla y baja al tocarlos.
const accionesPrincipales = [
  {
    verbo: 'Agregar',
    titulo: 'Pesaje',
    descripcion: 'Kilos por trabajador',
    formulario: 'pesaje',
    icono: Scale,
    estilo:
      'bg-primary [--relieve:color-mix(in_oklab,var(--primary),black_45%)] hover:bg-primary-hover',
    estiloIcono: 'text-primary',
  },
  {
    verbo: 'Agregar',
    titulo: 'Jornada',
    descripcion: 'Labor por jornal',
    formulario: 'jornada',
    icono: ClipboardList,
    estilo:
      'bg-leaf [--relieve:color-mix(in_oklab,var(--leaf),black_40%)] hover:bg-[color-mix(in_oklab,var(--leaf),black_10%)]',
    estiloIcono: 'text-leaf',
  },
];

// Acciones de menos uso: fila de teclas compactas bajo las principales. El color
// sigue el significado de toda la app (ingreso = leaf, gasto = destructive).
const accionesSecundarias = [
  { titulo: 'Agregar venta', formulario: 'venta', icono: HandCoins, tono: 'income' },
  { titulo: 'Agregar gasto', formulario: 'gasto', icono: ReceiptText, tono: 'expense' },
  { titulo: 'Agregar trabajador', formulario: 'trabajador', icono: UserPlus, tono: 'primary' },
];

export default function QuickActions({ onOpen }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {accionesPrincipales.map(
          ({ verbo, titulo, descripcion, formulario: tipo, icono: Icono, estilo, estiloIcono }) => (
            <button
              className={`flex min-h-40 min-w-0 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl p-4 text-center text-primary-foreground shadow-[0_4px_0_var(--relieve)] transition-[background-color,box-shadow,translate] duration-100 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-[4px] active:shadow-[0_0_0_var(--relieve)] motion-reduce:transition-none sm:min-h-44 ${estilo}`}
              key={tipo}
              onClick={() => onOpen(tipo)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`flex size-14 items-center justify-center rounded-full bg-primary-foreground ${estiloIcono}`}
              >
                <Icono className="size-6" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block text-balance font-heading text-xl font-semibold leading-tight sm:text-2xl">
                  {verbo} {titulo.toLowerCase()}
                </span>
                <span className="mt-1 block text-sm text-primary-foreground/80">{descripcion}</span>
              </span>
            </button>
          ),
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {accionesSecundarias.map(({ titulo, formulario: tipo, icono, tono }) => (
          <button
            className="flex min-h-28 min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-border bg-card px-2 py-3 text-foreground shadow-[0_3px_0_var(--border-strong)] transition-[background-color,box-shadow,translate] duration-100 hover:bg-tint focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-[3px] active:shadow-[0_0_0_var(--border-strong)] motion-reduce:transition-none sm:min-h-20 sm:flex-row sm:gap-3 sm:px-4"
            key={tipo}
            onClick={() => onOpen(tipo)}
            onFocus={tipoMovimiento[tipo] ? cargarFormularioMovimiento : undefined}
            onPointerEnter={tipoMovimiento[tipo] ? cargarFormularioMovimiento : undefined}
            type="button"
          >
            <IconBadge icon={icono} tone={tono} />
            <span className="text-balance text-center font-heading text-base font-semibold leading-tight sm:text-lg">
              {titulo}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
