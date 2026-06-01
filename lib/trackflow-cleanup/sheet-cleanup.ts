import { google } from "googleapis";

type AnyRecord = Record<string, any>;

export type SheetCleanupMode = "skip" | "mark" | "clear" | "delete";

export type SheetCleanupResult = {
  configured: boolean;
  skipped: boolean;
  rowNumber: number | null;
  rowNumbers?: number[];
  mode: SheetCleanupMode;
  ok: boolean;
  message: string;
  deletedCount?: number;
  updatedCount?: number;
  error?: string;
  details?: AnyRecord;
};

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Sheet1";
const MAX_CELL_CHARS = 45000;
const DEFAULT_SEARCH_END_COLUMN = "ZZ";

const HEADERS = [
  "Export Date",
  "Business Name",
  "Website URL",
  "Final Email",
  "Email Source",
  "Social Platform",
  "Social Link",
  "WhatsApp",
  "ChatGPT Prompt",
  "Lead Status",
  "Approval Status",
  "Send Status",
  "Service Type",
  "Audit Score",
  "Lead Label",
  "Main Issue",
  "Proof Points",
  "Report Token",
  "Report URL",
  "PDF File ID",
  "PDF View URL",
  "PDF Download URL",
  "PDF Expires At",
  "Report Page Viewed",
  "PDF Downloaded",
  "CTA Clicked",
  "Last Report Viewed At",
  "Last PDF Downloaded At",
  "Last CTA Clicked At",
  "Email Subject",
  "Email Body",
  "Decision Maker",
  "Decision Maker Title",
  "Contact Quality",
  "Tracking ID",
  "Firestore Lead ID",
  "Open Count",
  "Click Count",
  "Reply Status",
  "Last Synced",
  "Archive Status",
  "Notes",
  "Sender ID",
  "Attempt Count",
  "Queue Lock ID",
  "Queue Locked At",
  "Queue Attempt ID",
  "Source Type",
  "Outreach Channel",
  "Lead Source",
  "Audit Source",
  "Source Context",
  "Email Outreach Allowed",
  "LinkedIn Outreach Allowed",
] as const;

type HeaderName = (typeof HEADERS)[number];

function clean(value: unknown, fallback = ""): string {
  const text = String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim();
  return (text || fallback).slice(0, MAX_CELL_CHARS);
}

function cleanEnv(value: unknown): string {
  return String(value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

function errorMessage(error: unknown, fallback = "Unknown error"): string {
  if (error instanceof Error && error.message) return error.message.slice(0, 700);
  if (typeof error === "string" && error.trim()) return error.slice(0, 700);
  try {
    return JSON.stringify(error).slice(0, 700);
  } catch {
    return fallback;
  }
}

function columnLetter(index: number): string {
  let number = index + 1;
  let letter = "";

  while (number > 0) {
    const remainder = (number - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    number = Math.floor((number - 1) / 26);
  }

  return letter;
}

function lastColumnLetterForCount(count: number): string {
  return columnLetter(Math.max(0, count - 1));
}

function getSearchEndColumn(): string {
  const raw = clean(process.env.GOOGLE_SHEET_SEARCH_END_COLUMN || process.env.TRACKFLOW_SHEET_SEARCH_END_COLUMN || DEFAULT_SEARCH_END_COLUMN).toUpperCase();
  return /^[A-Z]{1,3}$/.test(raw) ? raw : DEFAULT_SEARCH_END_COLUMN;
}

function sheetRowNumberFallbackAllowed(): boolean {
  const raw = clean(process.env.ALLOW_SHEET_ROW_NUMBER_FALLBACK_DELETE || process.env.TRACKFLOW_ALLOW_SHEET_ROW_NUMBER_FALLBACK || "").toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(raw);
}

function getSheetEnv() {
  const spreadsheetId = cleanEnv(process.env.GOOGLE_SHEET_ID || process.env.TRACKFLOW_GOOGLE_SHEET_ID || "");
  const clientEmail = cleanEnv(
    process.env.GOOGLE_CLIENT_EMAIL ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      process.env.TRACKFLOW_GOOGLE_CLIENT_EMAIL ||
      "",
  );
  const privateKey = cleanEnv(
    process.env.GOOGLE_PRIVATE_KEY ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      process.env.TRACKFLOW_GOOGLE_PRIVATE_KEY ||
      "",
  ).replace(/\\n/g, "\n");

  return {
    spreadsheetId,
    clientEmail,
    privateKey,
    sheetName: SHEET_NAME,
    configured: Boolean(spreadsheetId && clientEmail && privateKey),
  };
}

export function isCleanupSheetConfigured(): boolean {
  return getSheetEnv().configured;
}

async function getSheetsClient() {
  const config = getSheetEnv();

  if (!config.spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing on the deployed cleanup server.");
  if (!config.clientEmail) throw new Error("GOOGLE_CLIENT_EMAIL is missing on the deployed cleanup server.");
  if (!config.privateKey) throw new Error("GOOGLE_PRIVATE_KEY is missing on the deployed cleanup server.");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return {
    sheets: google.sheets({ version: "v4", auth }),
    spreadsheetId: config.spreadsheetId,
  };
}

async function getWorksheetId(sheets: any, spreadsheetId: string): Promise<number> {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });

  const worksheets = response.data.sheets || [];
  const worksheet = worksheets.find((item: any) => item?.properties?.title === SHEET_NAME);
  const sheetId = Number(worksheet?.properties?.sheetId);

  if (!Number.isFinite(sheetId)) {
    throw new Error(`Google Sheet tab not found: ${SHEET_NAME}`);
  }

  return sheetId;
}

async function deleteSheetRows(sheets: any, spreadsheetId: string, rowNumbers: number[]): Promise<void> {
  const sheetId = await getWorksheetId(sheets, spreadsheetId);
  const rowsToDelete = [...new Set(rowNumbers)]
    .map((rowNumber) => Number(rowNumber || 0))
    .filter((rowNumber) => Number.isFinite(rowNumber) && rowNumber > 1)
    .sort((a, b) => b - a);

  if (!rowsToDelete.length) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: rowsToDelete.map((rowNumber) => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: "ROWS",
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      })),
    },
  });
}

function normalizeHeaderName(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .trim();
}

function mergeHeaderRow(rawHeaders: any[] = []): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  const add = (value: unknown) => {
    const header = clean(value);
    if (!header) return;
    const key = normalizeHeaderName(header);
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(header);
  };

  rawHeaders.forEach(add);
  HEADERS.forEach(add);

  return output.length ? output : [...HEADERS];
}

function findHeaderIndex(headers: string[], header: HeaderName | string): number {
  const target = normalizeHeaderName(header);
  return headers.findIndex((item) => normalizeHeaderName(item) === target);
}

function rowToObject(row: any[] = [], headers: string[], rowNumber?: number): AnyRecord {
  const record: AnyRecord = {};
  headers.forEach((header, index) => {
    record[header] = clean(row[index] || "");
  });
  if (rowNumber) record.rowNumber = rowNumber;
  return record;
}

function rowObjectToArray(row: AnyRecord, headers: string[]): string[] {
  return headers.map((header) => clean(row[header] || ""));
}

function cellAt(row: any[] = [], headers: string[], header: HeaderName | string): string {
  const index = findHeaderIndex(headers, header);
  if (index < 0) return "";
  return clean(row[index] || "");
}

async function readSheetTable(sheets: any, spreadsheetId: string): Promise<{ headers: string[]; rows: any[][] }> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:${getSearchEndColumn()}`,
  });

  const values = response.data.values || [];
  const headers = mergeHeaderRow(values[0] || []);
  const rows = values.slice(1);

  return { headers, rows };
}

async function ensureHeaderRow(sheets: any, spreadsheetId: string): Promise<string[]> {
  const { headers } = await readSheetTable(sheets, spreadsheetId);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:${lastColumnLetterForCount(headers.length)}1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
  return headers;
}

function normalizeTokenForMatch(value: unknown): string {
  return clean(value)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase()
    .slice(0, 128);
}

function cellTextContainsToken(value: unknown, token: string): boolean {
  const raw = clean(value).toLowerCase();
  if (!raw || !token) return false;
  if (raw.includes(token)) return true;
  return normalizeTokenForMatch(raw).includes(token);
}

function sheetRowMatchesReportToken(row: any[] = [], headers: string[], reportToken: string): boolean {
  const token = normalizeTokenForMatch(reportToken);
  if (!token) return false;

  const exactToken = normalizeTokenForMatch(cellAt(row, headers, "Report Token"));
  if (exactToken && exactToken === token) return true;

  const knownReportCells = [
    cellAt(row, headers, "Report URL"),
    cellAt(row, headers, "PDF View URL"),
    cellAt(row, headers, "PDF Download URL"),
    cellAt(row, headers, "Notes"),
  ];

  if (knownReportCells.some((value) => cellTextContainsToken(value, token))) return true;

  // Last-resort safety net:
  // Some older Sheet versions had different header order. Search the whole row
  // for the report token so cleanup does not silently miss existing rows.
  return row.some((value) => cellTextContainsToken(value, token));
}

async function findSheetRowsByReportToken(
  sheets: any,
  spreadsheetId: string,
  reportToken: string,
): Promise<{ headers: string[]; matchedRows: number[] }> {
  const token = normalizeTokenForMatch(reportToken);
  const { headers, rows } = await readSheetTable(sheets, spreadsheetId);

  if (!token) return { headers, matchedRows: [] };

  const matchedRows: number[] = [];
  rows.forEach((row: any[], index: number) => {
    if (sheetRowMatchesReportToken(row, headers, token)) {
      matchedRows.push(index + 2);
    }
  });

  return { headers, matchedRows };
}

function normalizeTargetRows(input: { rowNumber: number | null; matchedRows: number[]; reportToken: string }): { rows: number[]; fallbackUsed: boolean; fallbackAllowed: boolean } {
  const seen = new Set<number>();
  const output: number[] = [];

  const add = (value: number | null | undefined) => {
    const rowNumber = Number(value || 0) || 0;
    if (!Number.isFinite(rowNumber) || rowNumber <= 1 || seen.has(rowNumber)) return;
    seen.add(rowNumber);
    output.push(rowNumber);
  };

  input.matchedRows.forEach(add);

  const fallbackAllowed = !input.reportToken || sheetRowNumberFallbackAllowed();
  let fallbackUsed = false;

  // Token search is the safest path. Row-number fallback is disabled by default when a
  // report token exists, because Google Sheet rows can shift after previous deletions.
  if (!output.length && fallbackAllowed) {
    add(input.rowNumber);
    fallbackUsed = output.length > 0;
  }

  return { rows: output.sort((a, b) => a - b), fallbackUsed, fallbackAllowed };
}

async function readSingleSheetRow(sheets: any, spreadsheetId: string, headers: string[], rowNumber: number): Promise<AnyRecord> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetterForCount(headers.length)}${rowNumber}`,
  });
  const row = response.data.values?.[0] || [];
  return rowToObject(row, headers, rowNumber);
}

async function updateSingleSheetRow(sheets: any, spreadsheetId: string, headers: string[], rowNumber: number, row: AnyRecord): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetterForCount(headers.length)}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [rowObjectToArray(row, headers)] },
  });
}

function makeCleanupUpdates(input: {
  mode: Exclude<SheetCleanupMode, "delete">;
  cleanupMode: string;
  actor: string;
  reportToken: string;
}): AnyRecord {
  const now = new Date().toISOString();
  const baseUpdates: Partial<Record<HeaderName, string>> = {
    "Archive Status": input.cleanupMode === "hard" ? "Report Deleted" : "Report Cleaned",
    Notes: `Report cleanup ${input.cleanupMode} by ${input.actor} at ${now}. Token: ${input.reportToken}`,
    "Last Synced": now,
  };

  if (input.mode === "clear") {
    baseUpdates["Report Token"] = "";
    baseUpdates["Report URL"] = "";
    baseUpdates["PDF File ID"] = "";
    baseUpdates["PDF View URL"] = "";
    baseUpdates["PDF Download URL"] = "";
    baseUpdates["PDF Expires At"] = "";
    baseUpdates["Report Page Viewed"] = "";
    baseUpdates["PDF Downloaded"] = "";
    baseUpdates["CTA Clicked"] = "";
    baseUpdates["Last Report Viewed At"] = "";
    baseUpdates["Last PDF Downloaded At"] = "";
    baseUpdates["Last CTA Clicked At"] = "";
  }

  return baseUpdates;
}

export async function cleanupGoogleSheetReportRow(input: {
  rowNumber: number | null | undefined;
  mode: SheetCleanupMode;
  cleanupMode: string;
  actor: string;
  reportToken: string;
}): Promise<SheetCleanupResult> {
  const rowNumber = Number(input.rowNumber || 0) || null;
  const reportToken = normalizeTokenForMatch(input.reportToken);
  const config = getSheetEnv();

  if (input.mode === "skip") {
    return {
      configured: config.configured,
      skipped: true,
      rowNumber,
      rowNumbers: rowNumber ? [rowNumber] : [],
      mode: input.mode,
      ok: true,
      message: "Sheet cleanup skipped by request.",
      details: { sheetName: config.sheetName },
    };
  }

  if (!config.configured) {
    return {
      configured: false,
      skipped: false,
      rowNumber,
      rowNumbers: rowNumber ? [rowNumber] : [],
      mode: input.mode,
      ok: false,
      message: "Google Sheet cleanup could not run because Sheet service account ENV is not configured on the deployed cleanup server.",
      error: "Missing GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, or GOOGLE_PRIVATE_KEY on the deployed cleanup server.",
      details: {
        sheetName: config.sheetName,
        hasSpreadsheetId: Boolean(config.spreadsheetId),
        hasClientEmail: Boolean(config.clientEmail),
        hasPrivateKey: Boolean(config.privateKey),
      },
    };
  }

  try {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const { headers, matchedRows } = await findSheetRowsByReportToken(sheets, spreadsheetId, reportToken);
    const targetRowResult = normalizeTargetRows({ rowNumber, matchedRows, reportToken });
    const targetRows = targetRowResult.rows;

    if (!targetRows.length) {
      return {
        configured: true,
        skipped: true,
        rowNumber,
        rowNumbers: [],
        mode: input.mode,
        ok: true,
        message: reportToken
          ? "No matching Google Sheet row was found for this report token."
          : "No valid Google Sheet row number or report token was found for this report.",
        details: {
          sheetName: SHEET_NAME,
          searchedUntilColumn: getSearchEndColumn(),
          reportTokenFound: false,
          matchedRows,
          rowNumberFallbackAllowed: targetRowResult.fallbackAllowed,
          rowNumberFallbackUsed: targetRowResult.fallbackUsed,
        },
      };
    }

    if (input.mode === "delete") {
      await deleteSheetRows(sheets, spreadsheetId, targetRows);

      return {
        configured: true,
        skipped: false,
        rowNumber: targetRows[0] || rowNumber,
        rowNumbers: targetRows,
        mode: input.mode,
        ok: true,
        deletedCount: targetRows.length,
        message:
          targetRows.length === 1
            ? `Sheet row ${targetRows[0]} deleted.`
            : `${targetRows.length} Sheet rows deleted: ${targetRows.join(", ")}.`,
        details: {
          sheetName: SHEET_NAME,
          matchedByReportToken: matchedRows,
          deletedRows: targetRows,
          rowNumberFallbackAllowed: targetRowResult.fallbackAllowed,
          rowNumberFallbackUsed: targetRowResult.fallbackUsed,
        },
      };
    }

    const updatedHeaders = await ensureHeaderRow(sheets, spreadsheetId);
    const updates = makeCleanupUpdates({
      mode: input.mode,
      cleanupMode: input.cleanupMode,
      actor: input.actor,
      reportToken: input.reportToken,
    });

    for (const targetRow of targetRows) {
      const existing = await readSingleSheetRow(sheets, spreadsheetId, updatedHeaders, targetRow);
      await updateSingleSheetRow(sheets, spreadsheetId, updatedHeaders, targetRow, { ...existing, ...updates });
    }

    return {
      configured: true,
      skipped: false,
      rowNumber: targetRows[0] || rowNumber,
      rowNumbers: targetRows,
      mode: input.mode,
      ok: true,
      updatedCount: targetRows.length,
      message:
        input.mode === "clear"
          ? `${targetRows.length} Sheet row(s) report fields cleared.`
          : `${targetRows.length} Sheet row(s) marked cleaned.`,
      details: {
        sheetName: SHEET_NAME,
        matchedByReportToken: matchedRows,
        updatedRows: targetRows,
        rowNumberFallbackAllowed: targetRowResult.fallbackAllowed,
        rowNumberFallbackUsed: targetRowResult.fallbackUsed,
      },
    };
  } catch (error) {
    return {
      configured: true,
      skipped: false,
      rowNumber,
      rowNumbers: rowNumber ? [rowNumber] : [],
      mode: input.mode,
      ok: false,
      message: "Google Sheet cleanup failed.",
      error: errorMessage(error),
      details: {
        sheetName: SHEET_NAME,
        searchedUntilColumn: getSearchEndColumn(),
      },
    };
  }
}
