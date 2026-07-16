// ── Configuración del gestor de boda (plantilla genérica de listas) ──────────
// Cada categoría = una pestaña propia en el mismo Google Sheet del RSVP, gestionada
// por un único backend (`api/planner.ts`) y una única página dinámica
// (`planner/[id].astro`). Añadir una categoría nueva = añadir una entrada aquí +
// sus textos en `i18n/translations.admin.ts` (sección `planner`), nada más.
//
// Los campos marcados `isCost: true` alimentan la página `/planner/presupuesto`
// (fuera de esta plantilla genérica, ver ese fichero): suma esos campos de todas las
// categorías para dar un sumatorio de gastos, sin necesitar una pestaña propia.
//
// No incluye "Invitaciones" (calculadora de una sola fila, no una lista) — se aborda
// aparte si hace falta.

export type FieldType = 'text' | 'tel' | 'email' | 'url' | 'number' | 'textarea' | 'select';

export interface FieldConfig {
  /** Nombre de columna interno (también la cabecera literal que se escribe en el Sheet). */
  key: string;
  type: FieldType;
  /** Clave i18n (bajo `planner.fieldLabels.<labelKey>`) para la etiqueta del campo. */
  labelKey: string;
  /** Para type 'select': claves i18n (bajo `planner.options.<valor>`) de las opciones. */
  options?: string[];
  required?: boolean;
  /** Si es un importe que debe sumarse en `/planner/presupuesto` (ver cabecera del fichero). */
  isCost?: boolean;
}

export interface CategoryConfig {
  /** Slug de ruta (`/planner/<id>`) y clave i18n (`plannerNav.<id>`). */
  id: string;
  /** Nombre de la pestaña en Google Sheets (MAYÚSCULAS, sin acentos). */
  sheetTab: string;
  /** Grupo del menú off-canvas (ver AdminNav.astro). */
  group: 'organizacion' | 'proveedores';
  /** Texto de fallback (ES) antes de que el JS de i18n aplique la traducción. */
  label: string;
  fields: FieldConfig[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'tareas',
    sheetTab: 'TAREAS',
    group: 'organizacion',
    label: 'Lista de tareas',
    fields: [
      { key: 'tarea', type: 'text', labelKey: 'tarea', required: true },
      { key: 'fecha_limite', type: 'text', labelKey: 'fechaLimite' },
      { key: 'progreso', type: 'select', labelKey: 'progreso', options: ['pendiente', 'enProceso', 'hecho'] },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'coordinacion',
    sheetTab: 'COORDINACION',
    group: 'organizacion',
    label: 'Coordinación',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'rol', type: 'text', labelKey: 'rol' },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'tarifa', type: 'number', labelKey: 'tarifa', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'planificacion',
    sheetTab: 'PLANIFICACION',
    group: 'organizacion',
    label: 'Planificación del día',
    fields: [
      { key: 'hora', type: 'text', labelKey: 'hora', required: true },
      { key: 'etapa', type: 'text', labelKey: 'etapa', required: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'musica',
    sheetTab: 'MUSICA',
    group: 'organizacion',
    label: 'Música',
    fields: [
      { key: 'momento', type: 'select', labelKey: 'momento', options: ['ceremonia', 'coctel', 'cena', 'baile'] },
      { key: 'cancion', type: 'text', labelKey: 'cancion', required: true },
      { key: 'artista', type: 'text', labelKey: 'artista' },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'regalos',
    sheetTab: 'REGALOS',
    group: 'organizacion',
    label: 'Regalos',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'descripcion', type: 'text', labelKey: 'descripcion' },
      { key: 'cantidad', type: 'number', labelKey: 'cantidad' },
      { key: 'precio', type: 'number', labelKey: 'precio', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'lugar',
    sheetTab: 'LUGAR',
    group: 'proveedores',
    label: 'Lugar',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'contacto', type: 'text', labelKey: 'contacto' },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'direccion', type: 'text', labelKey: 'direccion' },
      { key: 'capacidad', type: 'number', labelKey: 'capacidad' },
      { key: 'precio_salon', type: 'number', labelKey: 'precioSalon', isCost: true },
      { key: 'coste_persona', type: 'number', labelKey: 'costePersona', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'hotel',
    sheetTab: 'HOTEL',
    group: 'proveedores',
    label: 'Hotel',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'contacto', type: 'text', labelKey: 'contacto' },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'precio_habitacion', type: 'number', labelKey: 'precioHabitacion', isCost: true },
      { key: 'precio_suite', type: 'number', labelKey: 'precioSuite', isCost: true },
      { key: 'habitaciones_min', type: 'number', labelKey: 'habitacionesMin' },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'vestuario',
    sheetTab: 'VESTUARIO',
    group: 'proveedores',
    label: 'Vestuario',
    fields: [
      { key: 'categoria', type: 'text', labelKey: 'categoria', required: true },
      { key: 'nombre', type: 'text', labelKey: 'nombre' },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'arreglos', type: 'select', labelKey: 'arreglos', options: ['si', 'no'] },
      { key: 'coste_total', type: 'number', labelKey: 'costeTotal', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'peluqueria',
    sheetTab: 'PELUQUERIA',
    group: 'proveedores',
    label: 'Peluquería y maquillaje',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'servicio', type: 'select', labelKey: 'servicio', options: ['novia', 'otras'] },
      { key: 'coste', type: 'number', labelKey: 'coste', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'flores',
    sheetTab: 'FLORES',
    group: 'proveedores',
    label: 'Flores',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'elemento', type: 'select', labelKey: 'elemento', options: ['ramoNovia', 'prendidos', 'centrosMesa', 'otros'] },
      { key: 'coste_total', type: 'number', labelKey: 'costeTotal', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'tarta',
    sheetTab: 'TARTA',
    group: 'proveedores',
    label: 'Tarta',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'precio_racion', type: 'number', labelKey: 'precioRacion', isCost: true },
      { key: 'coste_transporte', type: 'number', labelKey: 'costeTransporte', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'catering',
    sheetTab: 'CATERING',
    group: 'proveedores',
    label: 'Catering',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'contacto', type: 'text', labelKey: 'contacto' },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'coste_persona', type: 'number', labelKey: 'costePersona', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'fotografo',
    sheetTab: 'FOTOGRAFO',
    group: 'proveedores',
    label: 'Fotógrafo',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'coste_total', type: 'number', labelKey: 'costeTotal', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'videografo',
    sheetTab: 'VIDEOGRAFO',
    group: 'proveedores',
    label: 'Videógrafo',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'tarifa', type: 'number', labelKey: 'tarifa', isCost: true },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
  {
    id: 'entretenimiento',
    sheetTab: 'ENTRETENIMIENTO',
    group: 'proveedores',
    label: 'Entretenimiento',
    fields: [
      { key: 'nombre', type: 'text', labelKey: 'nombre', required: true },
      { key: 'telefono', type: 'tel', labelKey: 'telefono' },
      { key: 'email', type: 'email', labelKey: 'email' },
      { key: 'web', type: 'url', labelKey: 'web' },
      { key: 'coste_estimado', type: 'number', labelKey: 'costeEstimado', isCost: true },
      { key: 'horas', type: 'number', labelKey: 'horas' },
      { key: 'observaciones', type: 'textarea', labelKey: 'observaciones' },
    ],
  },
];

export function getCategory(id: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Categorías con al menos un campo `isCost` — las que alimentan `/planner/presupuesto`. */
export function getCostCategories(): CategoryConfig[] {
  return CATEGORIES.filter((c) => c.fields.some((f) => f.isCost));
}

export function getCostFields(cat: CategoryConfig): FieldConfig[] {
  return cat.fields.filter((f) => f.isCost);
}
