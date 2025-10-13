'use server';

import { schools } from '@/db/schema';
import { boeReportService } from './service';

type School = typeof schools.$inferSelect;

export async function generateBoeReportForFaculty(school?: School) {
  if (!school) {
    throw new Error('Please select a school');
  }
  try {
    const buffer = await boeReportService.generateBoeReportForFaculty(school);
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
