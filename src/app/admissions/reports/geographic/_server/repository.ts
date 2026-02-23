import {
	and,
	avg,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	type SQL,
} from 'drizzle-orm';
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

export interface LocationAggregation {
	city: string;
	count: number;
	latitude: number;
	longitude: number;
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
			.orderBy(desc(count()));

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
			.orderBy(desc(count()));

		return rows
			.filter((r) => r.district)
			.map((r) => ({
				district: r.district!,
				count: r.count,
			}));
	}

	async getLocationAggregation(
		filter: AdmissionReportFilter
	): Promise<LocationAggregation[]> {
		const conditions = buildConditions(filter);
		conditions.push(eq(applicantLocations.country, 'Lesotho'));
		conditions.push(isNotNull(applicantLocations.city));
		conditions.push(isNotNull(applicantLocations.latitude));
		conditions.push(isNotNull(applicantLocations.longitude));
		const whereClause = and(...conditions);

		const rows = await db
			.select({
				city: applicantLocations.city,
				count: count(),
				latitude: avg(applicantLocations.latitude),
				longitude: avg(applicantLocations.longitude),
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
			.groupBy(applicantLocations.city)
			.orderBy(desc(count()))
			.limit(10);

		return rows
			.filter((r) => r.city && r.latitude && r.longitude)
			.map((r) => ({
				city: r.city!,
				count: r.count,
				latitude: Number(r.latitude),
				longitude: Number(r.longitude),
			}));
	}
}
