export interface ExcelData {
	headers: string[];
	rows: (string | number)[][];
	sheetNames?: string[];
	selectedSheet?: string;
}

export interface ExcelWorkbook {
	sheetNames: string[];
	sheets: Record<string, ExcelData>;
}

export interface StudentRecord {
	studentNumber: string;
	studentName?: string;
	marks: Record<number, number>;
}

export interface ColumnMapping {
	studentNumberColumn: string | null;
	assessmentColumns: Record<number, string>;
}

export interface DetectedColumns {
	studentNumberColumn: string | null;
	assessmentColumns: Record<number, string>;
	confidence: number;
}

export interface AssessmentInfo {
	id: number;
	assessmentType: string;
	assessmentNumber: string;
	totalMarks: number;
	weight: number;
}

export interface ImportResult {
	success: boolean;
	imported: number;
	failed: number;
	errors: string[];
}

export interface ParsedRow {
	rowIndex: number;
	studentNumber: string;
	studentModuleId?: number;
	studentName?: string;
	assessmentMarks: Record<number, number>;
	isValid: boolean;
	isRegistered: boolean;
	errors: string[];
}
