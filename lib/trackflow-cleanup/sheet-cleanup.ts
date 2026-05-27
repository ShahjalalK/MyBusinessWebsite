import { google } from "googleapis";

type AnyRecord = Record<string, any>;

export type SheetCleanupMode = "skip" | "mark" | "clear";

export type SheetCleanupResult = {
  configured: boolean;
  skipped: boolean;
  rowNumber: number | null;
  mode: SheetCleanupMode;
  ok: boolean;
  message: string;
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
  mode: SheetCleanupMode;
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

  if (input.mode === "skip") {
    return {
      configured: isCleanupSheetConfigured(),
      skipped: true,
      rowNumber,
      mode: input.mode,
      ok: true,
      message: "Sheet cleanup skipped by request.",
    };
  }

  if (!rowNumber || rowNumber <= 1) {
    return {
      configured: isCleanupSheetConfigured(),
      skipped: true,
      rowNumber,
      mode: input.mode,
      ok: true,
      message: "No valid Google Sheet row number was found for this report.",
    };
  }

  if (!isCleanupSheetConfigured()) {
    return {
      configured: false,
      skipped: true,
      rowNumber,
      mode: input.mode,
      ok: true,
      message: "Google Sheet cleanup skipped because Sheet service account ENV is not configured on the deployed server.",
    };
  }

  try {
    const { sheets, spreadsheetId } = await getSheetsClient();
    await ensureHeaderRow(sheets, spreadsheetId);
    const existing = await readSingleSheetRow(sheets, spreadsheetId, rowNumber);
    const updates = makeCleanupUpdates({
      mode: input.mode,
      cleanupMode: input.cleanupMode,
      actor: input.actor,
      reportToken: input.reportToken,
    });

    await updateSingleSheetRow(sheets, spreadsheetId, rowNumber, { ...existing, ...updates });

    return {
      configured: true,
      skipped: false,
      rowNumber,
      mode: input.mode,
      ok: true,
      message: input.mode === "clear" ? `Sheet row ${rowNumber} report fields cleared.` : `Sheet row ${rowNumber} marked cleaned.`,
    };
  } catch (error) {
    return {
      configured: true,
      skipped: false,
      rowNumber,
      mode: input.mode,
      ok: false,
      message: "Google Sheet cleanup failed.",
      error: errorMessage(error),
    };
  }
}
