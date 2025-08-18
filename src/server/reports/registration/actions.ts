'use server';

import { registrationReportService } from './service';

export async function generateFullRegistrationReport(termId: number) {
  try {
    const buffer =
      await registrationReportService.generateFullRegistrationReport(termId);
    const base64Data = Buffer.from(buffer).toString('base64');
    return { success: true, data: base64Data };
  } catch (error) {
    console.error('Error generating full registration report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateSummaryRegistrationReport(termId: number) {
  try {
    const buffer =
      await registrationReportService.generateSummaryRegistrationReport(termId);
    const base64Data = Buffer.from(buffer).toString('base64');
    return { success: true, data: base64Data };
  } catch (error) {
    console.error('Error generating summary registration report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getAvailableTermsForReport() {
  try {
    const terms = await registrationReportService.getAvailableTerms();
    return { success: true, data: terms };
  } catch (error) {
    console.error('Error fetching available terms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getRegistrationDataPreview(termId: number) {
  try {
    const data =
      await registrationReportService.getRegistrationDataForTerm(termId);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching registration data preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getPaginatedRegistrationStudents(
  termId: number,
  page: number = 1,
  pageSize: number = 20
) {
  try {
    const data =
      await registrationReportService.getPaginatedRegistrationStudents(
        termId,
        page,
        pageSize
      );
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching paginated registration students:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
