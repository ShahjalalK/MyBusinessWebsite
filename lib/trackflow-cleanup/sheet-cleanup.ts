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
};

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Sheet1";
const MAX_CELL_CHARS = 45000;

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

function lastColumnLetter(): string {
  return columnLetter(HEADERS.length - 1);
}

function getSheetEnv() {
  const spreadsheetId = clean(process.env.GOOGLE_SHEET_ID || process.env.TRACKFLOW_GOOGLE_SHEET_ID || "");
  const clientEmail = clean(process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "");
  const privateKey = clean(process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  return {
    spreadsheetId,
    clientEmail,
    privateKey,
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

async function deleteSingleSheetRow(sheets: any, spreadsheetId: string, rowNumber: number): Promise<void> {
  const sheetId = await getWorksheetId(sheets, spreadsheetId);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });
}

async function ensureHeaderRow(sheets: any, spreadsheetId: string): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:${lastColumnLetter()}1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADERS] },
  });
}

function rowToObject(row: any[] = [], rowNumber?: number): AnyRecord {
  const record: AnyRecord = {};
  HEADERS.forEach((header, index) => {
    record[header] = clean(row[index] || "");
  });
  if (rowNumber) record.rowNumber = rowNumber;
  return record;
}

function rowObjectToArray(row: AnyRecord): string[] {
  return HEADERS.map((header) => clean(row[header] || ""));
}


function headerIndex(header: HeaderName): number {
  return HEADERS.indexOf(header);
}

function cellAt(row: any[] = [], header: HeaderName): string {
  const index = headerIndex(header);
  if (index < 0) return "";
  return clean(row[index] || "");
}

function normalizeTokenForMatch(value: unknown): string {
  return clean(value)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase()
    .slice(0, 128);
}

function sheetRowMatchesReportToken(row: any[] = [], reportToken: string): boolean {
  const token = normalizeTokenForMatch(reportToken);
  if (!token) return false;

  const exactToken = normalizeTokenForMatch(cellAt(row, "Report Token"));
  if (exactToken && exactToken === token) return true;

  const searchableCells = [
    cellAt(row, "Report URL"),
    cellAt(row, "PDF View URL"),
    cellAt(row, "PDF Download URL"),
    cellAt(row, "Notes"),
  ]
    .join(" ")
    .toLowerCase();

  return Boolean(searchableCells && searchableCells.includes(token));
}

async function findSheetRowsByReportToken(sheets: any, spreadsheetId: string, reportToken: string): Promise<number[]> {
  const token = normalizeTokenForMatch(reportToken);
  if (!token) return [];

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:${lastColumnLetter()}`,
  });

  const rows = response.data.values || [];
  const matches: number[] = [];

  rows.forEach((row: any[], index: number) => {
    if (sheetRowMatchesReportToken(row, token)) {
      matches.push(index + 2);
    }
  });

  return matches;
}

function normalizeTargetRows(input: { rowNumber: number | null; matchedRows: number[] }): number[] {
  const seen = new Set<number>();
  const output: number[] = [];

  const add = (value: number | null | undefined) => {
    const rowNumber = Number(value || 0) || 0;
    if (!Number.isFinite(rowNumber) || rowNumber <= 1 || seen.has(rowNumber)) return;
    seen.add(rowNumber);
    output.push(rowNumber);
  };

  input.matchedRows.forEach(add);

  // Fallback only when no report-token match was found. This avoids deleting the wrong
  // row if Google Sheet rows have shifted after earlier deletions.
  if (!output.length) add(input.rowNumber);

  return output.sort((a, b) => a - b);
}

async function readSingleSheetRow(sheets: any, spreadsheetId: string, rowNumber: number): Promise<AnyRecord> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
  });
  const row = response.data.values?.[0] || [];
  return rowToObject(row, rowNumber);
}

async function updateSingleSheetRow(sheets: any, spreadsheetId: string, rowNumber: number, row: AnyRecord): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A${rowNumber}:${lastColumnLetter()}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [rowObjectToArray(row)] },
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

  if (input.mode === "skip") {
    return {
      configured: isCleanupSheetConfigured(),
      skipped: true,
      rowNumber,
      rowNumbers: rowNumber ? [rowNumber] : [],
      mode: input.mode,
      ok: true,
      message: "Sheet cleanup skipped by request.",
    };
  }

  if (!isCleanupSheetConfigured()) {
    return {
      configured: false,
      skipped: true,
      rowNumber,
      rowNumbers: rowNumber ? [rowNumber] : [],
      mode: input.mode,
      ok: true,
      message: "Google Sheet cleanup skipped because Sheet service account ENV is not configured on the deployed server.",
    };
  }

  try {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const matchedRows = await findSheetRowsByReportToken(sheets, spreadsheetId, reportToken);
    const targetRows = normalizeTargetRows({ rowNumber, matchedRows });

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
      };
    }

    if (input.mode === "delete") {
      const rowsToDelete = [...targetRows].sort((a, b) => b - a);
      for (const targetRow of rowsToDelete) {
        await deleteSingleSheetRow(sheets, spreadsheetId, targetRow);
      }

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
      };
    }

    await ensureHeaderRow(sheets, spreadsheetId);
    const updates = makeCleanupUpdates({
      mode: input.mode,
      cleanupMode: input.cleanupMode,
      actor: input.actor,
      reportToken: input.reportToken,
    });

    for (const targetRow of targetRows) {
      const existing = await readSingleSheetRow(sheets, spreadsheetId, targetRow);
      await updateSingleSheetRow(sheets, spreadsheetId, targetRow, { ...existing, ...updates });
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
    };
  }
}
