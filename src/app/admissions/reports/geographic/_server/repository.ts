import { and, count, eq, inArray, type SQL } from 'drizzle-orm';
import {
	applicantLocations,
	applicants,
	applications,
	db,
	programs,
	schools,
} from '@/core/database';
import type { AdmissionReportFilter } from '../../_shared/types';

export interface LocationData {
	country: string | null;
	city: string | null;
	district: string | null;
	latitude: number | null;
	longitude: number | null;
	count: number;
}

export interface CountryAggregation {
	country: string;
	count: number;
}

export interface DistrictAggregation {
	district: string;
	count: number;
}

function buildConditions(filter: AdmissionReportFilter): SQL[] {
	const conditions: SQL[] = [];
	if (filter.intakePeriodId) {
		conditions.push(eq(applications.intakePeriodId, filter.intakePeriodId));
	}
	if (filter.schoolIds?.length) {
		conditions.push(inArray(programs.schoolId, filter.schoolIds));
	}
	if (filter.programId) {
		conditions.push(eq(applications.firstChoiceProgramId, filter.programId));
	}
	if (filter.programLevels?.length) {
		conditions.push(inArray(programs.level, filter.programLevels));
	}
	if (filter.applicationStatuses?.length) {
		conditions.push(inArray(applications.status, filter.applicationStatuses));
	}
	return conditions;
}

export class GeographicRepository {
	async getCountryAggregation(
		filter: AdmissionReportFilter
	): Promise<CountryAggregation[]> {
		const conditions = buildConditions(filter);
		const whereClause = conditions.length ? and(...conditions) : undefined;

		const rows = await db
			.select({
				country: applicantLocations.country,
				count: count(),
			})
			.from(applications)
			.innerJoin(applicants, eq(applications.applicantId, applicants.id))
			.innerJoin(
				applicantLocations,
				eq(applicants.id, applicantLocations.applicantId)
			)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(applicantLocations.country)
			.orderBy(count());

		return rows
			.filter((r) => r.country)
			.map((r) => ({
				country: r.country!,
				count: r.count,
			}));
	}

	async getDistrictAggregation(
		filter: AdmissionReportFilter
	): Promise<DistrictAggregation[]> {
		const conditions = buildConditions(filter);
		const whereClause = conditions.length ? and(...conditions) : undefined;

		const rows = await db
			.select({
				district: applicantLocations.district,
				count: count(),
			})
			.from(applications)
			.innerJoin(applicants, eq(applications.applicantId, applicants.id))
			.innerJoin(
				applicantLocations,
				eq(applicants.id, applicantLocations.applicantId)
			)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(applicantLocations.district)
			.orderBy(count());

		return rows
			.filter((r) => r.district)
			.map((r) => ({
				district: r.district!,
				count: r.count,
			}));
	}

	async getLocationData(
		filter: AdmissionReportFilter
	): Promise<LocationData[]> {
		const conditions = buildConditions(filter);
		const whereClause = conditions.length ? and(...conditions) : undefined;

		const rows = await db
			.select({
				country: applicantLocations.country,
				city: applicantLocations.city,
				district: applicantLocations.district,
				latitude: applicantLocations.latitude,
				longitude: applicantLocations.longitude,
				count: count(),
			})
			.from(applications)
			.innerJoin(applicants, eq(applications.applicantId, applicants.id))
			.innerJoin(
				applicantLocations,
				eq(applicants.id, applicantLocations.applicantId)
			)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(
				applicantLocations.country,
				applicantLocations.city,
				applicantLocations.district,
				applicantLocations.latitude,
				applicantLocations.longitude
			);

		return rows;
	}
}
