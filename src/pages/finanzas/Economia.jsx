import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Coffee,
  Landmark,
  Search,
  UserRound,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';

const secciones = {
  pagos: {
    titulo: 'Pagos',
    descripcion:
      'Consulta y administra el dinero entregado a los trabajadores por las labores realizadas en la finca.',
    buscar: 'pagos',
    icono: UserRound,
    registros: [
      {
        id: 'pago-1',
        trabajador: 'Lucía Marín',
        cedula: '1.024.658.321',
        actividad: 'Recolección de café',
        detalle: 'Lote La Vega · 20–23 oct.',
        fecha: '2026-10-24',
        valor: '$ 320.000',
        estado: 'pagado',
      },
      {
        id: 'pago-2',
        trabajador: 'Carlos Rojas',
        cedula: '1.018.452.790',
        actividad: 'Deshierbe / Plateo',
        detalle: 'Lote El Roble · 22 oct.',
        fecha: '2026-10-22',
        valor: '$ 180.000',
        estado: 'pendiente',
      },
      {
        id: 'pago-3',
        trabajador: 'María Fernanda Gil',
        cedula: '1.096.741.258',
        actividad: 'Recolección de café',
        detalle: 'Lote La Vega · 17 oct.',
        fecha: '2026-10-18',
        valor: '$ 245.000',
        estado: 'pagado',
      },
      {
        id: 'pago-4',
        trabajador: 'Jorge Andrés Pardo',
        cedula: '79.845.216',
        actividad: 'Aplicación de abono',
        detalle: 'Finca La Esperanza · 25 oct.',
        fecha: '2026-10-25',
        valor: '$ 210.000',
        estado: 'pendiente',
      },
      {
        id: 'pago-5',
        trabajador: 'Ana Milena Torres',
        cedula: '1.032.778.541',
        actividad: 'Recolección de café',
        detalle: 'Lote El Roble · 26 oct.',
        fecha: '2026-10-26',
        valor: '$ 275.000',
        estado: 'pendiente',
      },
    ],
  },
  egresos: {
    titulo: 'Egresos',
    descripcion:
      'Registra y consulta las salidas de dinero relacionadas con la operación y administración de tus fincas.',
    accion: 'Registrar egreso',
    buscar: 'egresos',
    icono: ArrowDownLeft,
    registros: [
      {
        id: 'egreso-1',
        titulo: 'Fertilizante orgánico',
        detalle: 'Insumos agrícolas · Finca La Esperanza',
        fecha: '2026-10-25',
        valor: '$ 460.000',
        etiqueta: 'Insumos',
        tipo: 'egreso',
      },
      {
        id: 'egreso-2',
        titulo: 'Pago a Lucía Marín',
        detalle: 'Mano de obra · Asociado al pago del 24 oct.',
        fecha: '2026-10-24',
        valor: '$ 320.000',
        etiqueta: 'Generado desde Pagos',
        tipo: 'pago-asociado',
      },
      {
        id: 'egreso-3',
        titulo: 'Servicio de energía',
        detalle: 'Servicios públicos · Finca El Roble',
        fecha: '2026-10-20',
        valor: '$ 92.500',
        etiqueta: 'Servicios',
        tipo: 'egreso',
      },
    ],
  },
  ventas: {
    titulo: 'Ventas',
    descripcion:
      'Administra la comercialización del café y consulta los ingresos obtenidos por cada venta.',
    accion: 'Registrar venta',
    buscar: 'ventas',
    icono: Coffee,
    registros: [
      {
        id: 'venta-1',
        titulo: 'Café pergamino seco',
        detalle: '125 kg · $ 24.000 / kg · Cooperativa Cafetera',
        fecha: '2026-10-26',
        valor: '$ 3.000.000',
        etiqueta: 'Venta registrada',
        tipo: 'venta',
      },
      {
        id: 'venta-2',
        titulo: 'Café cereza',
        detalle: '80 kg · $ 4.500 / kg · Beneficio San José',
        fecha: '2026-10-19',
        valor: '$ 360.000',
        etiqueta: 'Venta registrada',
        tipo: 'venta',
      },
      {
        id: 'venta-3',
        titulo: 'Café pergamino húmedo',
        detalle: '210 kg · Comprador: Comercializadora Andina',
        fecha: '2026-10-12',
        valor: '$ 1.470.000',
        etiqueta: 'Venta registrada',
        tipo: 'venta',
      },
    ],
  },
};

const rutas = [
  { id: 'pagos', etiqueta: 'Pagos', ruta: '/economia/pagos' },
  { id: 'egresos', etiqueta: 'Egresos', ruta: '/economia/egresos' },
  { id: 'ventas', etiqueta: 'Ventas', ruta: '/economia/ventas' },
];

const categoriasEgreso = [
  'Fertilizantes e insumos agrícolas',
  'Materiales para fumigación',
  'Servicios públicos',
  'Remesa',
  'Transporte y fletes',
  'Mantenimiento',
  'Otros gastos',
];

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

function Campo({ children, etiqueta, htmlFor, className = '' }) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-[#34483a] ${className}`} htmlFor={htmlFor}>
      {etiqueta}
      {children}
    </label>
  );
}

function CampoTexto({ id, type = 'text', placeholder, ...props }) {
  return (
    <Input
      className="h-11 rounded-xl border-[#dfe5dc] bg-white px-3 text-sm shadow-none focus-visible:border-[#5b805e] focus-visible:ring-[#5b805e]/20"
      id={id}
      placeholder={placeholder}
      type={type}
      {...props}
    />
  );
}

function CampoSeleccion({ id, children, defaultValue }) {
  return (
    <select
      className="h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#34483a] outline-none focus-visible:border-[#5b805e] focus-visible:ring-3 focus-visible:ring-[#5b805e]/20"
      defaultValue={defaultValue}
      id={id}
    >
      {children}
    </select>
  );
}

function Formulario({ seccion, onCancelar }) {
  const esVenta = seccion === 'ventas';
  const entidad = esVenta ? 'venta' : 'egreso';
  const Icono = esVenta ? Coffee : ArrowDownLeft;

  return (
    <section aria-labelledby="formulario-economia-titulo" className="rounded-2xl border border-[#e4e9df] bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-3 border-b border-[#edf0e9] pb-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf3e9] text-[#315d3b]">
          <Icono aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-[#183d2b]" id="formulario-economia-titulo">
            Datos del {entidad}
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#718071]">
            Completa la información necesaria para registrar este movimiento.
          </p>
        </div>
      </div>

      <form className="space-y-5">
        {esVenta ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo etiqueta="Fecha de venta" htmlFor="venta-fecha">
                <CampoTexto id="venta-fecha" type="date" />
              </Campo>
              <Campo etiqueta="Tipo o presentación del café" htmlFor="venta-presentacion">
                <CampoSeleccion defaultValue="" id="venta-presentacion">
                  <option disabled value="">Selecciona una presentación</option>
                  <option>Café cereza</option>
                  <option>Pergamino húmedo</option>
                  <option>Pergamino seco</option>
                  <option>Café verde / excelso</option>
                  <option>Otra presentación</option>
                </CampoSeleccion>
              </Campo>
              <Campo etiqueta="Cantidad vendida" htmlFor="venta-cantidad">
                <CampoTexto id="venta-cantidad" inputMode="decimal" placeholder="Ej. 125" />
              </Campo>
              <Campo etiqueta="Unidad de medida" htmlFor="venta-unidad">
                <CampoSeleccion defaultValue="kg" id="venta-unidad">
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="arroba">Arrobas</option>
                  <option value="bulto">Bultos</option>
                </CampoSeleccion>
              </Campo>
              <Campo etiqueta="Precio por unidad (COP)" htmlFor="venta-precio">
                <CampoTexto id="venta-precio" inputMode="numeric" placeholder="$ 0" />
              </Campo>
              <Campo etiqueta="Valor total de la venta (COP)" htmlFor="venta-total">
                <CampoTexto id="venta-total" inputMode="numeric" placeholder="$ 0" />
              </Campo>
            </div>
            <Campo etiqueta="Comprador o destinatario (opcional)" htmlFor="venta-comprador">
              <CampoTexto id="venta-comprador" placeholder="Ej. Cooperativa cafetera" />
            </Campo>
            <Campo etiqueta="Observaciones (opcional)" htmlFor="venta-observaciones">
              <textarea
                className="min-h-24 w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#899489] focus-visible:border-[#5b805e] focus-visible:ring-3 focus-visible:ring-[#5b805e]/20"
                id="venta-observaciones"
                placeholder="Detalles adicionales de la comercialización"
                rows="3"
              />
            </Campo>
            <p className="rounded-xl bg-[#f8faf6] px-4 py-3 text-xs leading-5 text-[#68766b]">
              Registra únicamente la cantidad comercializada; esta información no modifica las cantidades recolectadas o producidas.
            </p>
          </>
        ) : (
          <>
            <Campo etiqueta="Concepto del gasto" htmlFor="egreso-concepto">
              <CampoTexto id="egreso-concepto" placeholder="Ej. Compra de fertilizante" />
            </Campo>
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo etiqueta="Categoría" htmlFor="egreso-categoria">
                <CampoSeleccion defaultValue="" id="egreso-categoria">
                  <option disabled value="">Selecciona una categoría</option>
                  {categoriasEgreso.map((categoria) => (
                    <option key={categoria}>{categoria}</option>
                  ))}
                </CampoSeleccion>
              </Campo>
              <Campo etiqueta="Valor (COP)" htmlFor="egreso-valor">
                <CampoTexto id="egreso-valor" inputMode="numeric" placeholder="$ 0" />
              </Campo>
              <Campo etiqueta="Fecha" htmlFor="egreso-fecha">
                <CampoTexto id="egreso-fecha" type="date" />
              </Campo>
              <Campo etiqueta="Finca relacionada (opcional)" htmlFor="egreso-finca">
                <CampoSeleccion defaultValue="" id="egreso-finca">
                  <option value="">Selecciona una finca</option>
                  <option>Finca La Esperanza</option>
                  <option>Finca El Roble</option>
                </CampoSeleccion>
              </Campo>
            </div>
            <Campo etiqueta="Observaciones (opcional)" htmlFor="egreso-observaciones">
              <textarea
                className="min-h-24 w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#899489] focus-visible:border-[#5b805e] focus-visible:ring-3 focus-visible:ring-[#5b805e]/20"
                id="egreso-observaciones"
                placeholder="Añade información adicional sobre el gasto"
                rows="3"
              />
            </Campo>
          </>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-[#edf0e9] pt-5 sm:flex-row sm:justify-end">
          <Button
            className="h-11 rounded-xl border-[#dfe5dc] px-5 text-[#526254] hover:bg-[#f6f8f3]"
            onClick={onCancelar}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            className="h-11 rounded-xl bg-[#214b32] px-5 text-white hover:bg-[#173d2b]"
            type="button"
          >
            Guardar {entidad}
          </Button>
        </div>
      </form>
    </section>
  );
}

function TarjetaRegistro({ registro, seccion }) {
  const esVenta = seccion === 'ventas';
  const Icono = esVenta ? Coffee : Landmark;
  const colorValor = esVenta ? 'text-[#2f7042]' : 'text-[#263b2c]';

  return (
    <article className="rounded-2xl border border-[#e4e9df] bg-white p-4 shadow-[0_3px_14px_-12px_rgba(36,55,43,0.3)] transition-shadow hover:shadow-[0_8px_24px_-16px_rgba(36,55,43,0.35)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${esVenta ? 'bg-[#eaf4e8] text-[#427249]' : 'bg-[#f0f3eb] text-[#526b50]'}`}>
          <Icono aria-hidden="true" className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-[#263b2c]">{registro.titulo}</h2>
              <p className="mt-1 text-sm leading-5 text-[#718071]">{registro.detalle}</p>
            </div>
            <p className={`shrink-0 text-base font-bold ${colorValor}`}>{registro.valor}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#edf0e9] pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#718071]">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {new Date(`${registro.fecha}T12:00:00`).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              registro.tipo === 'pago-asociado'
                ? 'bg-[#eaf1e7] text-[#426348]'
                : esVenta
                  ? 'bg-[#eaf4e8] text-[#427249]'
                  : 'bg-[#fff3d9] text-[#8b5a16]'
            }`}>
              {registro.etiqueta}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function TarjetaPago({ registro }) {
  const pagado = registro.estado === 'pagado';

  return (
    <article className="rounded-2xl border border-[#e4e9df] bg-white p-4 shadow-[0_3px_14px_-12px_rgba(36,55,43,0.3)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#edf3e9] text-[#426348]">
            <UserRound aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-[#263b2c]">{registro.trabajador}</h2>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                pagado ? 'bg-[#eaf4e8] text-[#427249]' : 'bg-[#fff3d9] text-[#8b5a16]'
              }`}>
                {pagado ? 'Pagado' : 'Pendiente'}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#718071]">Cédula: {registro.cedula}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span>
                <span className="text-[#829084]">Actividad</span>
                <span className="ml-2 font-medium text-[#34483a]">{registro.actividad}</span>
              </span>
              <span>
                <span className="text-[#829084]">{pagado ? 'Fecha de pago' : 'Fecha de labor'}</span>
                <span className="ml-2 font-medium text-[#34483a]">
                  {new Date(`${registro.fecha}T12:00:00`).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </span>
            </div>
            <p className="mt-1 text-xs text-[#829084]">{registro.detalle}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#edf0e9] pt-4 sm:min-w-44 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-xs text-[#829084]">{pagado ? 'Total pagado' : 'Total a pagar'}</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-[#214b32]">{registro.valor}</p>
          </div>
          <Button
            className={pagado
              ? 'h-10 min-w-28 rounded-xl border-[#dfe5dc] bg-[#f5f7f3] text-[#879287]'
              : 'h-10 min-w-28 rounded-xl bg-[#214b32] px-5 text-white hover:bg-[#173d2b]'}
            disabled={pagado}
            type="button"
            variant={pagado ? 'outline' : 'default'}
          >
            {pagado ? <Check aria-hidden="true" /> : null}
            {pagado ? 'Pagado' : 'Pagar'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function PagosPanel() {
  const [estado, setEstado] = useState('pendiente');
  const [busqueda, setBusqueda] = useState('');
  const pagos = secciones.pagos.registros;

  const cantidades = useMemo(
    () => ({
      pendiente: pagos.filter((pago) => pago.estado === 'pendiente').length,
      pagado: pagos.filter((pago) => pago.estado === 'pagado').length,
      todos: pagos.length,
    }),
    [pagos],
  );

  const pagosVisibles = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    const terminoCedula = termino.replace(/\D/g, '');
    return pagos.filter((pago) => {
      const coincideEstado = estado === 'todos' || pago.estado === estado;
      const coincideBusqueda =
        !termino ||
        normalizarTexto(pago.trabajador).includes(termino) ||
        (terminoCedula.length > 0 &&
          pago.cedula.replace(/\D/g, '').includes(terminoCedula));
      return coincideEstado && coincideBusqueda;
    });
  }, [busqueda, estado, pagos]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header>
        <p className="mb-2 text-xs font-bold tracking-[0.16em] text-[#7b887c]">ECONOMÍA</p>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-[#183d2b] sm:text-3xl">
          Pagos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68766b] sm:text-base">
          Consulta los pagos pendientes y el historial de dinero entregado a tus trabajadores.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div aria-label="Filtrar pagos por estado" className="flex w-fit max-w-full rounded-xl border border-[#dfe5dc] bg-white p-1" role="group">
          {[
            { id: 'pendiente', etiqueta: 'Pendientes' },
            { id: 'pagado', etiqueta: 'Pagados' },
            { id: 'todos', etiqueta: 'Todos' },
          ].map((filtro) => (
            <button
              aria-pressed={estado === filtro.id}
              className={`min-h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                estado === filtro.id
                  ? 'bg-[#e7f0e3] text-[#214b32]'
                  : 'text-[#68766b] hover:bg-[#f5f7f3]'
              }`}
              key={filtro.id}
              onClick={() => setEstado(filtro.id)}
              type="button"
            >
              {filtro.etiqueta}
              <span className="ml-1.5 text-xs opacity-70">{cantidades[filtro.id]}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <label className="sr-only" htmlFor="buscar-pagos">Buscar por nombre o cédula</label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#7b887c]" />
          <Input
            autoComplete="off"
            className="h-11 rounded-xl border-[#dfe5dc] bg-white pl-10 shadow-sm placeholder:text-[#899489] focus-visible:border-[#5b805e] focus-visible:ring-[#5b805e]/20"
            id="buscar-pagos"
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre o cédula..."
            type="search"
            value={busqueda}
          />
        </div>
      </div>

      <nav aria-label="Secciones de Economía" className="flex gap-2 overflow-x-auto border-b border-[#e3e8dd]">
        {rutas.map((ruta) => (
          <NavLink
            aria-current={ruta.id === 'pagos' ? 'page' : undefined}
            className={`-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium ${
              ruta.id === 'pagos'
                ? 'border-[#426b48] text-[#214b32]'
                : 'border-transparent text-[#788579] hover:border-[#cbd8c7] hover:text-[#426348]'
            }`}
            key={ruta.id}
            to={ruta.ruta}
          >
            {ruta.etiqueta}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#34483a]">
          {estado === 'pendiente' ? 'Pagos pendientes' : estado === 'pagado' ? 'Historial de pagos' : 'Todos los pagos'}
        </h2>
        <span className="text-xs text-[#7b887c]">{pagosVisibles.length} registros</span>
      </div>

      {pagosVisibles.length > 0 ? (
        <div className="grid gap-3">
          {pagosVisibles.map((pago) => (
            <TarjetaPago key={pago.id} registro={pago} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d8e0d4] bg-white px-5 py-12 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#f0f3eb] text-[#526b50]">
            <UserRound aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-semibold text-[#34483a]">No encontramos pagos</h2>
          <p className="mt-1 text-sm text-[#718071]">Cambia el estado o la búsqueda para ver otros pagos.</p>
        </div>
      )}
    </section>
  );
}

export default function Economia({ seccion }) {
  const pagina = secciones[seccion] ?? secciones.pagos;
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [fecha, setFecha] = useState('');
  const Icono = pagina.icono;

  const registrosVisibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');
    return pagina.registros.filter((registro) => {
      const coincideTexto =
        !termino ||
        `${registro.titulo} ${registro.detalle} ${registro.etiqueta}`
          .toLocaleLowerCase('es')
          .includes(termino);
      return coincideTexto && (!fecha || registro.fecha === fecha);
    });
  }, [busqueda, fecha, pagina]);

  if (seccion === 'pagos') {
    return <PagosPanel />;
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-bold tracking-[0.16em] text-[#7b887c]">ECONOMÍA</p>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-[#183d2b] sm:text-3xl">
            {formularioAbierto ? `Registrar ${seccion === 'pagos' ? 'pago' : seccion === 'ventas' ? 'venta' : 'egreso'}` : pagina.titulo}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68766b] sm:text-base">
            {formularioAbierto
              ? 'Completa los datos de forma clara y sencilla.'
              : pagina.descripcion}
          </p>
        </div>
        {!formularioAbierto && (
          <Button
            className="h-11 w-full rounded-xl bg-[#214b32] px-4 text-white hover:bg-[#173d2b] sm:w-auto"
            onClick={() => setFormularioAbierto(true)}
            type="button"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            {pagina.accion}
          </Button>
        )}
      </header>

      <nav aria-label="Secciones de Economía" className="flex gap-2 overflow-x-auto border-b border-[#e3e8dd]">
        {rutas.map((ruta) => (
          <NavLink
            aria-current={seccion === ruta.id ? 'page' : undefined}
            className={`-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
              seccion === ruta.id
                ? 'border-[#426b48] text-[#214b32]'
                : 'border-transparent text-[#788579] hover:border-[#cbd8c7] hover:text-[#426348]'
            }`}
            key={ruta.id}
            to={ruta.ruta}
          >
            {ruta.etiqueta}
          </NavLink>
        ))}
      </nav>

      {formularioAbierto ? (
        <div className="space-y-4">
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[#526254] transition-colors hover:bg-[#edf2e9] hover:text-[#214b32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b48]"
            onClick={() => setFormularioAbierto(false)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a {pagina.titulo.toLocaleLowerCase('es')}
          </button>
          <Formulario onCancelar={() => setFormularioAbierto(false)} seccion={seccion} />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <label className="sr-only" htmlFor={`buscar-${seccion}`}>Buscar {pagina.buscar}</label>
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#7b887c]" />
              <Input
                autoComplete="off"
                className="h-11 rounded-xl border-[#dfe5dc] bg-white pl-10 shadow-sm placeholder:text-[#899489] focus-visible:border-[#5b805e] focus-visible:ring-[#5b805e]/20"
                id={`buscar-${seccion}`}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder={`Buscar ${pagina.buscar}...`}
                type="search"
                value={busqueda}
              />
            </div>
            <label className="relative flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#68766b] shadow-sm focus-within:border-[#5b805e] focus-within:ring-3 focus-within:ring-[#5b805e]/20">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-[#7b887c]" />
              <span className="shrink-0">Fecha</span>
              <input
                aria-label={`Filtrar ${pagina.buscar} por fecha`}
                className="min-w-0 bg-transparent text-sm text-[#34483a] outline-none"
                onChange={(event) => setFecha(event.target.value)}
                type="date"
                value={fecha}
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#34483a]">Movimientos recientes</h2>
            <span className="text-xs text-[#7b887c]">{registrosVisibles.length} registros</span>
          </div>

          {seccion === 'egresos' && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#dce9d8] bg-[#f4f8f1] px-4 py-3 text-sm leading-5 text-[#426348]">
              <ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Los pagos a trabajadores aparecen aquí automáticamente. No registres de nuevo un pago realizado desde la sección Pagos.
            </div>
          )}

          {registrosVisibles.length > 0 ? (
            <div className="grid gap-3">
              {registrosVisibles.map((registro) => (
                <TarjetaRegistro key={registro.id} registro={registro} seccion={seccion} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d8e0d4] bg-white px-5 py-12 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#f0f3eb] text-[#526b50]">
                <Icono aria-hidden="true" className="size-5" />
              </span>
              <h2 className="mt-4 font-semibold text-[#34483a]">No encontramos movimientos</h2>
              <p className="mt-1 text-sm text-[#718071]">Prueba con otra búsqueda o selecciona una fecha diferente.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
