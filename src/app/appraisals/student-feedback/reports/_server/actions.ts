'use server';

import type {
	StudentFeedbackReportData,
	StudentFeedbackReportFilter,
} from '../_lib/types';
import { generateStudentFeedbackExcel } from './excel';
import { studentFeedbackReportService } from './service';

export async function getStudentFeedbackReportData(
	filter: StudentFeedbackReportFilter
) {
	return studentFeedbackReportService.getReportData(filter);
}

export async function getStudentFeedbackLecturerDetail(
	userId: string,
	filter: StudentFeedbackReportFilter
) {
	return studentFeedbackReportService.getLecturerDetail(userId, filter);
}

export async function getStudentFeedbackCyclesByTerm(termId: number) {
	return studentFeedbackReportService.getCyclesByTerm(termId);
}

export async function getStudentFeedbackModulesForFilter(
	filter: StudentFeedbackReportFilter
) {
	return studentFeedbackReportService.getModulesForFilter(filter);
}

export async function exportStudentFeedbackReportExcel(
	data: StudentFeedbackReportData,
	filter: StudentFeedbackReportFilter
) {
	const buffer = await generateStudentFeedbackExcel(data, filter);
	return buffer.toString('base64');
}

export async function checkFullReportAccess() {
	return studentFeedbackReportService.hasFullAccess();
}
