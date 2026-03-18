import { and, eq } from 'drizzle-orm';
import { google, type sheets_v4 } from 'googleapis';
import { accounts, db } from '@/core/database';
import { getOAuth2Client } from './google-auth';

export interface SheetConfig {
	title: string;
	frozenRowCount?: number;
}

export interface SpreadsheetResult {
	spreadsheetId: string;
	spreadsheetUrl: string;
}

export interface FormatOptions {
	headerBackgroundColor?: {
		red: number;
		green: number;
		blue: number;
	};
	headerTextColor?: {
		red: number;
		green: number;
		blue: number;
	};
	headerBold?: boolean;
	autoResize?: boolean;
}


export async function hasGoogleSheetsScope(userId: string): Promise<boolean> {
	const account = await db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
	});

	if (!account || !account.scope) {
		return false;
	}

	return account.scope.includes('https://www.googleapis.com/auth/spreadsheets');
}

export async function createSpreadsheet(
	userId: string,
	title: string,
	sheetConfig?: SheetConfig
): Promise<SpreadsheetResult> {
	const auth = await getOAuth2Client(userId);
	const sheets = google.sheets({ version: 'v4', auth });

	const resource: sheets_v4.Schema$Spreadsheet = {
		properties: {
			title,
		},
		sheets: [
			{
				properties: {
					title: sheetConfig?.title || 'Sheet1',
					gridProperties: {
						frozenRowCount: sheetConfig?.frozenRowCount || 0,
					},
				},
			},
		],
	};

	const spreadsheet = await sheets.spreadsheets.create({
		requestBody: resource,
	});

	return {
		spreadsheetId: spreadsheet.data.spreadsheetId!,
		spreadsheetUrl: spreadsheet.data.spreadsheetUrl!,
	};
}

export async function getSheetId(
	userId: string,
	spreadsheetId: string,
	sheetIndex: number = 0
): Promise<number> {
	const auth = await getOAuth2Client(userId);
	const sheets = google.sheets({ version: 'v4', auth });

	const spreadsheet = await sheets.spreadsheets.get({
		spreadsheetId,
	});

	const sheetId = spreadsheet.data.sheets?.[sheetIndex]?.properties?.sheetId;

	if (sheetId === undefined || sheetId === null) {
		throw new Error(`Could not find sheet at index ${sheetIndex}`);
	}

	return sheetId;
}

export async function clearSheet(
	userId: string,
	spreadsheetId: string,
	range: string
): Promise<void> {
	const auth = await getOAuth2Client(userId);
	const sheets = google.sheets({ version: 'v4', auth });

	await sheets.spreadsheets.values.clear({
		spreadsheetId,
		range,
	});
}

export async function writeToSheet(
	userId: string,
	spreadsheetId: string,
	range: string,
	values: unknown[][]
): Promise<void> {
	const auth = await getOAuth2Client(userId);
	const sheets = google.sheets({ version: 'v4', auth });

	await sheets.spreadsheets.values.update({
		spreadsheetId,
		range,
		valueInputOption: 'RAW',
		requestBody: {
			values,
		},
	});
}

export async function formatSheet(
	userId: string,
	spreadsheetId: string,
	sheetId: number,
	options: FormatOptions = {}
): Promise<void> {
	const auth = await getOAuth2Client(userId);
	const sheets = google.sheets({ version: 'v4', auth });

	const requests: sheets_v4.Schema$Request[] = [];

	const headerBgColor = options.headerBackgroundColor || {
		red: 0.2,
		green: 0.2,
		blue: 0.2,
	};

	const headerTextColor = options.headerTextColor || {
		red: 1,
		green: 1,
		blue: 1,
	};

	requests.push({
		repeatCell: {
			range: {
				sheetId: sheetId,
				startRowIndex: 0,
				endRowIndex: 1,
			},
			cell: {
				userEnteredFormat: {
					backgroundColor: headerBgColor,
					textFormat: {
						foregroundColor: headerTextColor,
						bold: options.headerBold !== false,
					},
				},
			},
			fields: 'userEnteredFormat(backgroundColor,textFormat)',
		},
	});

	if (options.autoResize !== false) {
		const spreadsheet = await sheets.spreadsheets.get({
			spreadsheetId,
			includeGridData: true,
		});

		const sheet = spreadsheet.data.sheets?.find(
			(s) => s.properties?.sheetId === sheetId
		);

		const columnCount = sheet?.data?.[0]?.rowData?.[0]?.values?.length || 10;

		requests.push({
			autoResizeDimensions: {
				dimensions: {
					sheetId: sheetId,
					dimension: 'COLUMNS',
					startIndex: 0,
					endIndex: columnCount,
				},
			},
		});
	}

	await sheets.spreadsheets.batchUpdate({
		spreadsheetId,
		requestBody: {
			requests,
		},
	});
}

export async function batchUpdate(
	userId: string,
	spreadsheetId: string,
	requests: sheets_v4.Schema$Request[]
): Promise<void> {
	const auth = await getOAuth2Client(userId);
	const sheets = google.sheets({ version: 'v4', auth });

	await sheets.spreadsheets.batchUpdate({
		spreadsheetId,
		requestBody: {
			requests,
		},
	});
}
