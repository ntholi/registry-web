'use server';

import { statementOfResultsService } from './service';

export async function generateStatementOfResultsReport(
  schoolId: number,
  programId: number,
  termName?: string,
) {
  try {
    const buffer =
      await statementOfResultsService.generateStatementOfResultsReport(
        schoolId,
        programId,
        termName,
      );
    const base64Data = Buffer.from(buffer).toString('base64');
    return { success: true, data: base64Data };
  } catch (error) {
    console.error('Error generating statement of results report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
