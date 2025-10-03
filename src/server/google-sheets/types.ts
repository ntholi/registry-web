export interface ClearedStudent {
  stdNo: number;
  name: string;
  nationalId: string;
  programName: string;
  programCode: string;
  level: string;
  schoolName: string;
}

export interface PopulateResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  studentCount: number;
}
