'use server';

import {
	getActiveSchools,
	getProgramsBySchoolIds,
} from '@academic/schools/_server/actions';
import type { AttendanceReportFilter } from './repository';
import { attendanceReportService } from './service';

export async function getTermsForAttendanceReport() {
	try {
		const terms = await attendanceReportService.getTerms();
		return { success: true, data: terms };
	} catch (error) {
		console.error('Error fetching terms:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getSchoolsForAttendanceReport() {
	try {
		const schools = await getActiveSchools();
		return { success: true, data: schools };
	} catch (error) {
		console.error('Error fetching schools:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getProgramsForAttendanceReport(schoolIds?: number[]) {
	try {
		const programs = await getProgramsBySchoolIds(schoolIds);
		return { success: true, data: programs };
	} catch (error) {
		console.error('Error fetching programs:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getModulesForAttendanceReport(
	programId?: number,
	semesterNumber?: string
) {
	try {
		const modules = await attendanceReportService.getSemesterModulesForFilter(
			programId,
			semesterNumber
		);
		return { success: true, data: modules };
	} catch (error) {
		console.error('Error fetching modules:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAttendanceReportData(filter: AttendanceReportFilter) {
	try {
		const data = await attendanceReportService.getAttendanceReportData(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error fetching attendance report data:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
