'use server';

import { courseSummaryService } from './service';

export async function generateCourseSummaryReport(
  programId: number | undefined,
  semesterModuleId: number,
) {
  try {
    const buffer = await courseSummaryService.generateCourseSummaryReport(
      programId,
      semesterModuleId,
    );
    const base64Data = Buffer.from(buffer).toString('base64');
    return { success: true, data: base64Data };
  } catch (error) {
    console.error('Error generating course summary report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getAvailableModulesForProgram(programId: number) {
  try {
    const modules =
      await courseSummaryService.getAvailableModulesForProgram(programId);
    return { success: true, data: modules };
  } catch (error) {
    console.error('Error fetching available modules:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
