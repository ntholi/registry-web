'use server';

import { inArray } from 'drizzle-orm';
import { db } from '@/core/database';
import type { BoeFilter } from './repository';
import { boeReportService } from './service';

export async function getBoePreview(filter: BoeFilter) {
	try {
		const data = await boeReportService.getBoePreviewData(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error getting BOE preview:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getBoeClassReports(filter: BoeFilter) {
	try {
		const data = await boeReportService.getBoeClassReports(filter);
		return { success: true, data };
	} catch (error) {
		console.error('Error getting BOE class reports:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function generateBoeReport(filter: BoeFilter) {
	try {
		const buffer = await boeReportService.generateBoeReportWithFilter(filter);
		const base64Data = Buffer.from(buffer).toString('base64');
		return { success: true, data: base64Data };
	} catch (error) {
		console.error('Error generating BOE report:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getAvailableTerms() {
	try {
		const data = await db.query.terms.findMany({
			orderBy: (t, { desc }) => [desc(t.startDate)],
		});
		return { success: true, data };
	} catch (error) {
		console.error('Error getting terms:', error);
		return { success: false, error: 'Failed to load terms' };
	}
}

export async function getAvailableSchools() {
	try {
		const data = await db.query.schools.findMany({
			orderBy: (s) => [s.name],
		});
		return { success: true, data };
	} catch (error) {
		console.error('Error getting schools:', error);
		return { success: false, error: 'Failed to load schools' };
	}
}

export async function getAvailablePrograms(schoolIds?: number[]) {
	try {
		const data = await db.query.programs.findMany({
			where:
				schoolIds && schoolIds.length > 0
					? (p) => inArray(p.schoolId, schoolIds)
					: undefined,
			orderBy: (p) => [p.name],
		});
		return { success: true, data };
	} catch (error) {
		console.error('Error getting programs:', error);
		return { success: false, error: 'Failed to load programs' };
	}
}
