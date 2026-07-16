import type { APIRoute } from 'astro';
import { google } from 'googleapis';
import { getCategory, type FieldConfig } from '../../lib/plannerConfig';

export const prerender = false;

// Convierte un hex "rrggbb" al formato RGB 0-1 que usa la API de Sheets.
const rgb = (hex: string) => ({
  red: parseInt(hex.slice(0, 2), 16) / 255,
  green: parseInt(hex.slice(2, 4), 16) / 255,
  blue: parseInt(hex.slice(4, 6), 16) / 255,
});
const EUCALIPTO = rgb('47635f');
const OLIVA = rgb('d7d5b1');

function colLetter(index0: number): string {
  let n = index0 + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function headerFor(field: FieldConfig): string {
  return field.key.replace(/_/g, ' ').toUpperCase();
}

function getSheetsClient(readonly = false) {
  const keyJson = import.meta.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY no configurada');
  const credentials = JSON.parse(keyJson);
  if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  const spreadsheetId = import.meta.env.GOOGLE_SHEET_ID as string;
  const scope = readonly
    ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
    : 'https://www.googleapis.com/auth/spreadsheets';
  const auth = new google.auth.GoogleAuth({ credentials, scopes: [scope] });
  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId };
}

// Crea la pestaña de la categoría si no existe y (re)escribe su cabecera — idempotente,
// igual patrón que `ensureSetup()` de rsvp.ts y `ensureMesasSchema()` de mesas.ts.
async function ensureCategorySheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: string,
  fields: FieldConfig[],
): Promise<number> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const allSheets = (meta.data.sheets ?? []) as any[];
  let sheet = allSheets.find((s) => s.properties?.title === tab);

  if (!sheet) {
    const bRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
    });
    const added = (bRes.data.replies ?? []).find((r: any) => r.addSheet);
    sheet = { properties: added?.addSheet?.properties };
  }
  const sheetId = sheet.properties?.sheetId as number;

  const headers = fields.map(headerFor);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers] },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: headers.length },
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
        },
      ],
    },
  });

  return sheetId;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const catId = url.searchParams.get('cat') ?? '';
    const cat = getCategory(catId);
    if (!cat) {
      return new Response(JSON.stringify({ ok: false, error: 'Categoría desconocida' }), { status: 400 });
    }

    const { sheets, spreadsheetId } = getSheetsClient();
    await ensureCategorySheet(sheets, spreadsheetId, cat.sheetTab, cat.fields);

    const lastCol = colLetter(cat.fields.length - 1);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${cat.sheetTab}!A2:${lastCol}`,
    });
    const rows = (res.data.values ?? []) as string[][];

    const items = rows.map((r, i) => {
      const values: Record<string, string> = {};
      cat.fields.forEach((f, idx) => { values[f.key] = r[idx] ?? ''; });
      return { row: i + 2, values };
    }).filter((item) => Object.values(item.values).some((v) => v !== ''));

    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('planner GET error:', msg);
    return new Response(JSON.stringify({ ok: false, error: 'No se pudieron cargar los datos.' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const catId = String(body.cat ?? '');
    const cat = getCategory(catId);
    if (!cat) {
      return new Response(JSON.stringify({ ok: false, error: 'Categoría desconocida' }), { status: 400 });
    }

    const { sheets, spreadsheetId } = getSheetsClient();
    const sheetId = await ensureCategorySheet(sheets, spreadsheetId, cat.sheetTab, cat.fields);
    const lastCol = colLetter(cat.fields.length - 1);

    const action = String(body.action ?? '');

    if (action === 'delete') {
      const row = Number(body.row);
      if (!Number.isInteger(row) || row < 2) throw new Error('Fila inválida');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: { sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row },
            },
          }],
        },
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'save') {
      const values = (body.values ?? {}) as Record<string, unknown>;
      const rowValues = cat.fields.map((f) => String(values[f.key] ?? '').trim());
      const rowNum = Number(body.row);

      if (Number.isInteger(rowNum) && rowNum >= 2) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${cat.sheetTab}!A${rowNum}:${lastCol}${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [rowValues] },
        });
        return new Response(JSON.stringify({ ok: true, row: rowNum }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      const appendRes = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${cat.sheetTab}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
      });
      const updatedRange = appendRes.data.updates?.updatedRange ?? '';
      const match = updatedRange.match(/![A-Z]+(\d+)/);
      const newRow = match ? parseInt(match[1]) : null;
      return new Response(JSON.stringify({ ok: true, row: newRow }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    throw new Error('Acción no reconocida');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('planner POST error:', msg);
    return new Response(JSON.stringify({ ok: false, error: 'No se pudo guardar. Inténtalo de nuevo.' }), { status: 500 });
  }
};
