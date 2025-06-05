import { ASSESSMENT_TYPES } from '../../../assessments/[id]/assessments';
import { AssessmentInfo, DetectedColumns, ExcelData } from './types';
import {
  isValidStudentNumber,
  findColumnByHeader,
  fuzzyMatch,
  columnIndexToLetter,
} from './utils';

export class ColumnDetector {
  static detectColumns(
    excelData: ExcelData,
    assessments: AssessmentInfo[],
  ): DetectedColumns {
    const studentNumberColumn = this.detectStudentNumberColumn(excelData);
    const assessmentColumns = this.detectAssessmentColumns(
      excelData,
      assessments,
    );

    const confidence = this.calculateConfidence(
      studentNumberColumn,
      assessmentColumns,
      assessments,
    );

    return {
      studentNumberColumn,
      assessmentColumns,
      confidence,
    };
  }

  private static detectStudentNumberColumn(
    excelData: ExcelData,
  ): string | null {
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
        if (this.validateStudentNumberColumn(rows, colIndex)) {
          return columnIndexToLetter(colIndex);
        }
      }
    }

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      if (this.validateStudentNumberColumn(rows, colIndex)) {
        return columnIndexToLetter(colIndex);
      }
    }

    return null;
  }

  private static validateStudentNumberColumn(
    rows: (string | number)[][],
    columnIndex: number,
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
    assessments: AssessmentInfo[],
  ): Record<number, string> {
    const { headers } = excelData;
    const detectedColumns: Record<number, string> = {};

    for (const assessment of assessments) {
      const assessmentTypeLabel = ASSESSMENT_TYPES.find(
        (type) => type.value === assessment.assessmentType,
      )?.label;

      if (!assessmentTypeLabel) continue;

      const columnIndex = this.findAssessmentColumn(
        headers,
        assessmentTypeLabel,
      );
      if (columnIndex !== null) {
        detectedColumns[assessment.id] = columnIndexToLetter(columnIndex);
      }
    }

    return detectedColumns;
  }

  private static findAssessmentColumn(
    headers: string[],
    assessmentTypeLabel: string,
  ): number | null {
    let bestMatch: { index: number; score: number } | null = null;

    for (let i = 0; i < headers.length; i++) {
      const header = (headers[i] || '').toString().trim();
      if (!header) continue;

      const score = fuzzyMatch(header, assessmentTypeLabel);

      if (score > 0.7 && (bestMatch === null || score > bestMatch.score)) {
        bestMatch = { index: i, score };
      }
    }

    if (bestMatch && this.isMarksColumn(headers, bestMatch.index)) {
      return bestMatch.index;
    }

    return null;
  }

  private static isMarksColumn(
    headers: string[],
    columnIndex: number,
  ): boolean {
    const header = (headers[columnIndex] || '').toString().toLowerCase();
    const nextHeader =
      columnIndex + 1 < headers.length
        ? (headers[columnIndex + 1] || '').toString().toLowerCase()
        : '';

    const weightKeywords = ['weight', '%', 'percent', 'percentage'];
    const isNextColumnWeight = weightKeywords.some((keyword) =>
      nextHeader.includes(keyword),
    );

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
    assessments: AssessmentInfo[],
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
