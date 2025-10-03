import { google } from 'googleapis';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ClearedStudent } from './types';

async function getOAuth2Client(userId: string) {
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
  });

  if (!account) {
    throw new Error('Google account not connected');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
    `${process.env.AUTH_URL}/api/auth/callback/google`
  );

  if (!account.access_token) {
    throw new Error('No access token available. Please re-authenticate.');
  }

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token || undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await db
        .update(accounts)
        .set({
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date
            ? Math.floor(tokens.expiry_date / 1000)
            : null,
        })
        .where(
          and(eq(accounts.userId, userId), eq(accounts.provider, 'google'))
        );
    } else if (tokens.access_token) {
      await db
        .update(accounts)
        .set({
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date
            ? Math.floor(tokens.expiry_date / 1000)
            : null,
        })
        .where(
          and(eq(accounts.userId, userId), eq(accounts.provider, 'google'))
        );
    }
  });

  return oauth2Client;
}

async function hasGoogleSheetsScope(userId: string): Promise<boolean> {
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
  });

  if (!account || !account.scope) {
    return false;
  }

  return account.scope.includes('https://www.googleapis.com/auth/spreadsheets');
}

async function createSpreadsheet(
  userId: string,
  title: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const auth = await getOAuth2Client(userId);
  const sheets = google.sheets({ version: 'v4', auth });

  const resource = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Cleared Students',
          gridProperties: {
            frozenRowCount: 1,
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

async function populateSpreadsheet(
  userId: string,
  spreadsheetId: string,
  students: ClearedStudent[]
): Promise<void> {
  const auth = await getOAuth2Client(userId);
  const sheets = google.sheets({ version: 'v4', auth });

  // Get the spreadsheet to find the actual sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId;

  if (sheetId === undefined) {
    throw new Error('Could not find sheet ID');
  }

  const headers = [
    'Student No',
    'Name',
    'National ID',
    'Program Code',
    'Program Name',
    'Level',
    'School',
  ];

  const rows = students.map((student) => [
    student.stdNo.toString(),
    student.name,
    student.nationalId,
    student.programCode,
    student.programName,
    student.level,
    student.schoolName,
  ]);

  const values = [headers, ...rows];

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Cleared Students!A:Z',
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Cleared Students!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.2,
                  green: 0.2,
                  blue: 0.2,
                },
                textFormat: {
                  foregroundColor: {
                    red: 1,
                    green: 1,
                    blue: 1,
                  },
                  bold: true,
                },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 7,
            },
          },
        },
      ],
    },
  });
}

export const googleSheetsService = {
  getOAuth2Client,
  hasGoogleSheetsScope,
  createSpreadsheet,
  populateSpreadsheet,
};
