'use server';

import { boeReportService } from './service';

export async function generateBoeReportForFaculty(facultyId: number) {
  try {
    const buffer =
      await boeReportService.generateBoeReportForFaculty(facultyId);
    const base64Data = Buffer.from(buffer).toString('base64');
    return { success: true, data: base64Data };
  } catch (error) {
    console.error('Error generating BOE report for faculty:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateBoeReportForProgram(programId: number) {
  try {
    const buffer =
      await boeReportService.generateBoeReportForProgram(programId);
    const base64Data = Buffer.from(buffer).toString('base64');
    return { success: true, data: base64Data };
  } catch (error) {
    console.error('Error generating BOE report for program:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateBoeReportForFICT() {
  try {
    const buffer = await boeReportService.generateBoeReportForProgram(151);
    const base64Data = Buffer.from(buffer).toString('base64');
    return { success: true, data: base64Data };
  } catch (error) {
    console.error('Error generating BOE report for FICT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
