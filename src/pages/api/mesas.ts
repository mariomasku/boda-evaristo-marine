import type { APIRoute } from 'astro';
import { google } from 'googleapis';

export const prerender = false;

// ── Constantes ──────────────────────────────────────────────
const RSVP_TAB  = 'RSVP';
const MESAS_TAB  = 'MESAS';
const MESA_COL   = 'O';          // columna MESA en la pestaña RSVP (15ª)
const MESA_HEADER = 'MESA';
const NUPCIAL   = 'NUPCIAL';     // identificador especial de la mesa nupcial

// Colores de cabecera (mismos que rsvp.ts, para que la columna MESA quede coherente).
const rgb = (hex: string) => ({
  red:   parseInt(hex.slice(0, 2), 16) / 255,
  green: parseInt(hex.slice(2, 4), 16) / 255,
  blue:  parseInt(hex.slice(4, 6), 16) / 255,
});
const EUCALIPTO = rgb('47635f');
const OLIVA     = rgb('d7d5b1');

// ── Auth ────────────────────────────────────────────────────
function getSheetsClient(readonly: boolean) {
  const keyJson = import.meta.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY no configurada');
  const credentials = JSON.parse(keyJson);
  if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

  const spreadsheetId = import.meta.env.GOOGLE_SHEET_ID as string;
  const scope = readonly
    ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
    : 'https://www.googleapis.com/auth/spreadsheets';
  const auth   = new google.auth.GoogleAuth({ credentials, scopes: [scope] });
  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId };
}

// Normalización ligera para comparaciones sin distinguir caja.
const U = (v: unknown): string => (v == null ? '' : String(v)).trim().toUpperCase();

// ── Esquema (columna MESA + pestaña MESAS) ──────────────────
// Idempotente: se puede llamar en cada request sin efectos secundarios.
async function ensureMesasSchema(sheets: any, spreadsheetId: string): Promise<{ rsvpId: number }> {
  const meta      = await sheets.spreadsheets.get({ spreadsheetId });
  const allSheets = (meta.data.sheets ?? []) as any[];
  const rsvpSheet  = allSheets.find(s => s.properties?.title === RSVP_TAB);
  const mesasSheet = allSheets.find(s => s.properties?.title === MESAS_TAB);
  const rsvpId = rsvpSheet?.properties?.sheetId ?? 0;

  // Cabecera de la columna MESA (no toca el resto de cabeceras que gestiona rsvp.ts).
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${RSVP_TAB}!${MESA_COL}1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[MESA_HEADER]] },
  });

  // Crear la pestaña MESAS si no existe, con su cabecera.
  if (!mesasSheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: MESAS_TAB } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${MESAS_TAB}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['ID', 'NOMBRE']] },
    });
  }

  // Formato de la cabecera MESA (mismo estilo que las demás columnas de RSVP).
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        repeatCell: {
          range: { sheetId: rsvpId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 14, endColumnIndex: 15 },
          cell: {
            userEnteredFormat: {
              backgroundColor: EUCALIPTO,
              textFormat: { foregroundColor: OLIVA, bold: true, fontSize: 9 },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        },
      }],
    },
  });

  return { rsvpId };
}

// Lee las filas de RSVP (A2:O) y devuelve invitados confirmados con su nº de fila real.
async function readGuests(sheets: any, spreadsheetId: string) {
  const res  = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${RSVP_TAB}!A2:O` });
  const rows = (res.data.values ?? []) as string[][];
  // idx: B=1 NOMBRE, C=2 ROL, E=4 ASISTENCIA, F=5 EDAD, O=14 MESA
  return rows.map((r, i) => ({
    row:    i + 2,
    nombre: r[1] ?? '',
    rol:    r[2] ?? '',
    edad:   r[5] ?? '',
    asiste: U(r[4]) === 'SÍ' || U(r[4]) === 'SI',
    mesa:   (r[14] ?? '').trim() || null,
  }));
}

// Lee la pestaña MESAS → mapa id → nombre.
async function readMesasMeta(sheets: any, spreadsheetId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res  = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${MESAS_TAB}!A2:B` });
    for (const r of (res.data.values ?? []) as string[][]) {
      if (r[0]) map.set(String(r[0]).trim(), r[1] ?? '');
    }
  } catch {
    /* la pestaña puede no existir todavía */
  }
  return map;
}

// ── GET: estado actual ──────────────────────────────────────
export const GET: APIRoute = async () => {
  try {
    const { sheets, spreadsheetId } = getSheetsClient(true);

    const [allRows, metaMap] = await Promise.all([
      readGuests(sheets, spreadsheetId),
      readMesasMeta(sheets, spreadsheetId),
    ]);

    const guests = allRows
      .filter(g => g.asiste && g.nombre)
      .map(g => ({ row: g.row, nombre: g.nombre, rol: g.rol, edad: g.edad, mesa: g.mesa }));

    // Agrupar por identificador de mesa. Se incluyen los ids que aparecen en la
    // columna MESA y también los que existan en la pestaña MESAS aunque estén vacíos.
    const ids = new Set<string>();
    guests.forEach(g => { if (g.mesa) ids.add(g.mesa); });
    metaMap.forEach((_v, k) => ids.add(k));

    const mesas = [...ids].map(id => ({
      id,
      esNupcial: U(id) === NUPCIAL,
      nombre: metaMap.get(id) ?? '',
      personas: guests.filter(g => g.mesa === id).map(g => ({ row: g.row, nombre: g.nombre, rol: g.rol, edad: g.edad })),
    }));

    // Orden: nupcial primero, luego numéricas ascendentes, luego el resto.
    mesas.sort((a, b) => {
      if (a.esNupcial) return -1;
      if (b.esNupcial) return 1;
      const na = parseInt(a.id, 10), nb = parseInt(b.id, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.id.localeCompare(b.id);
    });

    return new Response(JSON.stringify({
      ok: true,
      guests,
      mesas,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('MESAS GET error:', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ── POST: guardar / eliminar ────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? '');

    const { sheets, spreadsheetId } = getSheetsClient(false);
    await ensureMesasSchema(sheets, spreadsheetId);

    // Filas actuales de la columna MESA (para saber qué liberar).
    const guests = await readGuests(sheets, spreadsheetId);

    if (action === 'save') {
      const id    = normalizeId(body.id);
      const nombre = String(body.nombre ?? '').trim();
      const rows   = Array.isArray(body.rows) ? body.rows.map(Number).filter(n => Number.isInteger(n) && n >= 2) : [];
      if (!id) throw new Error('Identificador de mesa inválido');

      // Filas que actualmente tienen este id pero ya no deben tenerlo → limpiar.
      const rowsSet   = new Set(rows);
      const toClear   = guests.filter(g => g.mesa === id && !rowsSet.has(g.row)).map(g => g.row);

      const valueRanges = [
        ...rows.map(r => ({ range: `${RSVP_TAB}!${MESA_COL}${r}`, values: [[id]] })),
        ...toClear.map(r => ({ range: `${RSVP_TAB}!${MESA_COL}${r}`, values: [['']] })),
      ];
      if (valueRanges.length) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: { valueInputOption: 'USER_ENTERED', data: valueRanges },
        });
      }

      await upsertMesaMeta(sheets, spreadsheetId, id, nombre);
      return json({ ok: true });
    }

    if (action === 'delete') {
      const id = normalizeId(body.id);
      if (!id) throw new Error('Identificador de mesa inválido');

      const toClear = guests.filter(g => g.mesa === id).map(g => g.row);
      if (toClear.length) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: toClear.map(r => ({ range: `${RSVP_TAB}!${MESA_COL}${r}`, values: [['']] })),
          },
        });
      }
      await deleteMesaMeta(sheets, spreadsheetId, id);
      return json({ ok: true });
    }

    throw new Error('Acción no reconocida');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('MESAS POST error:', msg);
    return new Response(JSON.stringify({
      ok: false,
      error: 'No se pudo guardar la mesa. Inténtalo de nuevo en unos minutos.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ── Helpers de la pestaña MESAS ─────────────────────────────
// Un id válido es "NUPCIAL" o un entero positivo (como texto).
function normalizeId(raw: unknown): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  if (U(s) === NUPCIAL) return NUPCIAL;
  const n = parseInt(s, 10);
  return (!isNaN(n) && n >= 1 && String(n) === s) ? String(n) : null;
}

async function readMesaMetaRows(sheets: any, spreadsheetId: string): Promise<string[][]> {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${MESAS_TAB}!A2:B` });
    return (res.data.values ?? []) as string[][];
  } catch {
    return [];
  }
}

async function upsertMesaMeta(sheets: any, spreadsheetId: string, id: string, nombre: string) {
  const rows = await readMesaMetaRows(sheets, spreadsheetId);
  const idx  = rows.findIndex(r => String(r[0]).trim() === id);
  if (idx >= 0) {
    // Fila real = idx + 2 (A2 es la primera).
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${MESAS_TAB}!A${idx + 2}:B${idx + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[id, nombre]] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${MESAS_TAB}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[id, nombre]] },
    });
  }
}

async function deleteMesaMeta(sheets: any, spreadsheetId: string, id: string) {
  const rows = await readMesaMetaRows(sheets, spreadsheetId);
  const idx  = rows.findIndex(r => String(r[0]).trim() === id);
  if (idx < 0) return;
  // Localizar el sheetId de MESAS para poder borrar la fila físicamente.
  const meta  = await sheets.spreadsheets.get({ spreadsheetId });
  const mesasSheet = ((meta.data.sheets ?? []) as any[]).find(s => s.properties?.title === MESAS_TAB);
  const mesasId = mesasSheet?.properties?.sheetId;
  if (mesasId == null) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId: mesasId, dimension: 'ROWS', startIndex: idx + 1, endIndex: idx + 2 },
        },
      }],
    },
  });
}

function json(obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
