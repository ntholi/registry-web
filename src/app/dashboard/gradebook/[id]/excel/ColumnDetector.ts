import { ASSESSMENT_TYPES } from '../../../assessments/[id]/assessments';
import type { AssessmentInfo, DetectedColumns, ExcelData } from './types';
import { columnIndexToLetter, findColumnByHeader, fuzzyMatch, isValidStudentNumber } from './utils';

export class ColumnDetector {
	static detectColumns(excelData: ExcelData, assessments: AssessmentInfo[]): DetectedColumns {
		const studentNumberColumn = ColumnDetector.detectStudentNumberColumn(excelData);
		const assessmentColumns = ColumnDetector.detectAssessmentColumns(excelData, assessments);

		const confidence = ColumnDetector.calculateConfidence(
			studentNumberColumn,
			assessmentColumns,
			assessments
		);

		return {
			studentNumberColumn,
			assessmentColumns,
			confidence,
		};
	}

	private static detectStudentNumberColumn(excelData: ExcelData): string | null {
		const { headers, rows } = excelData;

		const studentNumberKeywords = [
			'student number',
			'student no',
			'std no',
			'stdno',
			'id',
			'student id',
			'registration number',
			'reg no',
			'regno',
		];

		for (const keyword of studentNumberKeywords) {
			const colIndex = findColumnByHeader(headers, keyword);
			if (colIndex !== null) {
				if (ColumnDetector.validateStudentNumberColumn(rows, colIndex)) {
					return columnIndexToLetter(colIndex);
				}
			}
		}

		for (let colIndex = 0; colIndex < headers.length; colIndex++) {
			if (ColumnDetector.validateStudentNumberColumn(rows, colIndex)) {
				return columnIndexToLetter(colIndex);
			}
		}

		return null;
	}

	private static validateStudentNumberColumn(
		rows: (string | number)[][],
		columnIndex: number
	): boolean {
		let validCount = 0;
		let totalCount = 0;

		for (const row of rows.slice(0, Math.min(20, rows.length))) {
			const value = row[columnIndex];
			if (value !== undefined && value !== null && value !== '') {
				totalCount++;
				if (isValidStudentNumber(value)) {
					validCount++;
				}
			}
		}

		return totalCount > 0 && validCount / totalCount > 0.7;
	}
	private static detectAssessmentColumns(
		excelData: ExcelData,
		assessments: AssessmentInfo[]
	): Record<number, string> {
		const { headers, rows } = excelData;
		const detectedColumns: Record<number, string> = {};

		for (const assessment of assessments) {
			const assessmentTypeLabel = ASSESSMENT_TYPES.find(
				(type) => type.value === assessment.assessmentType
			)?.label;

			if (!assessmentTypeLabel) continue;

			const columnIndex = ColumnDetector.findAssessmentColumn(headers, rows, assessmentTypeLabel);
			if (columnIndex !== null) {
				detectedColumns[assessment.id] = columnIndexToLetter(columnIndex);
			}
		}

		return detectedColumns;
	}
	private static findAssessmentColumn(
		headers: string[],
		rows: (string | number)[][],
		assessmentTypeLabel: string
	): number | null {
		let bestMatch: { index: number; score: number; rowIndex: number } | null = null;

		const searchRows = Math.min(15, rows.length);
		const searchVariations = ColumnDetector.createAssessmentVariations(assessmentTypeLabel);

		for (let rowIndex = 0; rowIndex < searchRows; rowIndex++) {
			const row = rows[rowIndex];

			for (let colIndex = 0; colIndex < row.length; colIndex++) {
				const cellValue = (row[colIndex] || '').toString().trim();
				if (!cellValue) continue;

				let score = 0;

				for (const variation of searchVariations) {
					const exactScore = cellValue.toLowerCase() === variation.toLowerCase() ? 1.0 : 0;
					const fuzzyScore = fuzzyMatch(cellValue, variation);
					score = Math.max(score, exactScore, fuzzyScore);
				}

				if (score > 0.6 && (bestMatch === null || score > bestMatch.score)) {
					bestMatch = { index: colIndex, score, rowIndex };
				}
			}
		}

		if (
			bestMatch &&
			ColumnDetector.isMarksColumn(headers, rows, bestMatch.index, bestMatch.rowIndex)
		) {
			return bestMatch.index;
		}

		return null;
	}

	private static createAssessmentVariations(assessmentTypeLabel: string): string[] {
		const variations = [assessmentTypeLabel];

		const baseLabel = assessmentTypeLabel.toLowerCase();

		if (baseLabel.includes('assignment')) {
			const match = baseLabel.match(/assignment\s*(\d+)/);
			if (match) {
				const num = match[1];
				variations.push(
					`Assignment${num}`,
					`Assign ${num}`,
					`Assign${num}`,
					`A${num}`,
					`ASS ${num}`,
					`ASS${num}`
				);
			}
		}

		if (baseLabel.includes('lab') && baseLabel.includes('test')) {
			const match = baseLabel.match(/lab\s*test\s*(\d+)/);
			if (match) {
				const num = match[1];
				variations.push(
					`LabTest${num}`,
					`Lab${num}`,
					`LT${num}`,
					`L${num}`,
					`Test ${num}`,
					`Test${num}`
				);
			}
		}

		if (baseLabel.includes('final') && baseLabel.includes('exam')) {
			variations.push('FinalExam', 'Final', 'Exam', 'FE', 'Final Examination');
		}

		if (baseLabel.includes('mid') && baseLabel.includes('term')) {
			variations.push('MidTerm', 'Midterm', 'MT', 'Mid', 'Mid-Term');
		}

		const words = assessmentTypeLabel.split(/\s+/);
		if (words.length > 1) {
			const acronym = words.map((word) => word.charAt(0).toUpperCase()).join('');
			variations.push(acronym);

			const numberMatch = assessmentTypeLabel.match(/\d+/);
			if (numberMatch) {
				variations.push(`${words[0]}${numberMatch[0]}`);
			}
		}

		return variations;
	}
	private static isMarksColumn(
		headers: string[],
		rows: (string | number)[][],
		columnIndex: number,
		foundRowIndex: number
	): boolean {
		const checkRows = [foundRowIndex - 1, foundRowIndex, foundRowIndex + 1].filter(
			(rowIndex) => rowIndex >= 0 && rowIndex < rows.length
		);

		for (const rowIndex of checkRows) {
			const row = rows[rowIndex];
			if (!row || columnIndex >= row.length) continue;

			const cellValue = (row[columnIndex] || '').toString().toLowerCase();
			const nextCellValue =
				columnIndex + 1 < row.length ? (row[columnIndex + 1] || '').toString().toLowerCase() : '';

			const weightKeywords = ['weight', '%', 'percent', 'percentage'];
			const isNextColumnWeight = weightKeywords.some((keyword) => nextCellValue.includes(keyword));

			if (isNextColumnWeight) {
				const marksKeywords = ['mark', 'score', 'point', 'grade'];
				return (
					marksKeywords.some((keyword) => cellValue.includes(keyword)) ||
					!weightKeywords.some((keyword) => cellValue.includes(keyword))
				);
			}
		}

		const header = (headers[columnIndex] || '').toString().toLowerCase();
		const nextHeader =
			columnIndex + 1 < headers.length
				? (headers[columnIndex + 1] || '').toString().toLowerCase()
				: '';

		const weightKeywords = ['weight', '%', 'percent', 'percentage'];
		const isNextColumnWeight = weightKeywords.some((keyword) => nextHeader.includes(keyword));

		if (isNextColumnWeight) {
			const marksKeywords = ['mark', 'score', 'point', 'grade'];
			return (
				marksKeywords.some((keyword) => header.includes(keyword)) ||
				!weightKeywords.some((keyword) => header.includes(keyword))
			);
		}

		return true;
	}

	private static calculateConfidence(
		studentNumberColumn: string | null,
		assessmentColumns: Record<number, string>,
		assessments: AssessmentInfo[]
	): number {
		let score = 0;

		if (studentNumberColumn) {
			score += 0.4;
		}

		const detectedAssessments = Object.keys(assessmentColumns).length;
		const totalAssessments = assessments.length;

		if (totalAssessments > 0) {
			score += (detectedAssessments / totalAssessments) * 0.6;
		}

		return Math.min(score, 1);
	}
}
