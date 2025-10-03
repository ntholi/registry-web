import {
  createSpreadsheet,
  getSheetId,
  clearSheet,
  writeToSheet,
  formatSheet,
  hasGoogleSheetsScope,
} from '@/lib/google-sheets';

export interface ClearedStudent {
  stdNo: number;
  name: string;
  nationalId: string;
  programName: string;
  programCode: string;
  level: string;
  schoolName: string;
}

export async function checkGoogleSheetsAccess(
  userId: string
): Promise<boolean> {
  return hasGoogleSheetsScope(userId);
}

export async function createGraduationSpreadsheet(
  userId: string,
  title: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  return createSpreadsheet(userId, title, {
    title: 'Cleared Students',
    frozenRowCount: 1,
  });
}

export async function populateGraduationSpreadsheet(
  userId: string,
  spreadsheetId: string,
  students: ClearedStudent[]
): Promise<void> {
  const sheetId = await getSheetId(userId, spreadsheetId);

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

  await clearSheet(userId, spreadsheetId, 'Cleared Students!A:Z');

  await writeToSheet(userId, spreadsheetId, 'Cleared Students!A1', values);

  await formatSheet(userId, spreadsheetId, sheetId, {
    headerBackgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
    headerTextColor: { red: 1, green: 1, blue: 1 },
    headerBold: true,
    autoResize: true,
  });
}
