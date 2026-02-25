import { applicationScores } from '@admissions/applications/_schema/applicationScores';
import {
	and,
	count,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	lte,
	type SQL,
} from 'drizzle-orm';
import { applications, db, programs, schools } from '@/core/database';
import type { AdmissionReportFilter } from '../../_shared/types';

export interface ProgramDemandRow {
	programId: number;
	programCode: string;
	programName: string;
	programLevel: string;
	schoolName: string;
	schoolId: number;
	firstChoice: number;
	secondChoice: number;
	total: number;
}

export interface SchoolDemandRow {
	schoolId: number;
	schoolName: string;
	count: number;
}

function buildConditions(filter: AdmissionReportFilter): SQL[] {
	const conditions: SQL[] = [];
	if (filter.intakePeriodId) {
		conditions.push(eq(applications.intakePeriodId, filter.intakePeriodId));
	}
	if (filter.applicationStatuses?.length) {
		conditions.push(inArray(applications.status, filter.applicationStatuses));
	}
	return conditions;
}

function buildScoreConditions(filter: AdmissionReportFilter): SQL[] {
	if (!filter.scoreRange) return [];
	return [
		isNotNull(applicationScores.overallScore),
		gte(applicationScores.overallScore, filter.scoreRange[0]),
		lte(applicationScores.overallScore, filter.scoreRange[1]),
	];
}

export class ProgramDemandRepository {
	async getProgramDemand(
		filter: AdmissionReportFilter
	): Promise<ProgramDemandRow[]> {
		const conditions = buildConditions(filter);
		const scoreConditions = buildScoreConditions(filter);

		const schoolFilter = filter.schoolIds?.length
			? inArray(programs.schoolId, filter.schoolIds)
			: undefined;
		const levelFilter = filter.programLevels?.length
			? inArray(programs.level, filter.programLevels)
			: undefined;
		const programFilter = filter.programId
			? eq(programs.id, filter.programId)
			: undefined;

		const allFilters = [schoolFilter, levelFilter, programFilter].filter(
			Boolean
		);

		const firstChoice = db
			.select({
				programId: programs.id,
				programCode: programs.code,
				programName: programs.name,
				programLevel: programs.level,
				schoolName: schools.code,
				schoolId: schools.id,
				cnt: count().as('cnt'),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(
				applicationScores,
				eq(applications.id, applicationScores.applicationId)
			)
			.where(and(...conditions, ...scoreConditions, ...allFilters) || undefined)
			.groupBy(
				programs.id,
				programs.code,
				programs.name,
				programs.level,
				schools.id,
				schools.code
			);

		const secondChoice = db
			.select({
				programId: programs.id,
				programCode: programs.code,
				programName: programs.name,
				programLevel: programs.level,
				schoolName: schools.code,
				schoolId: schools.id,
				cnt: count().as('cnt'),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.secondChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(
				applicationScores,
				eq(applications.id, applicationScores.applicationId)
			)
			.where(and(...conditions, ...scoreConditions, ...allFilters) || undefined)
			.groupBy(
				programs.id,
				programs.code,
				programs.name,
				programs.level,
				schools.id,
				schools.code
			);

		const [firstRows, secondRows] = await Promise.all([
			firstChoice,
			secondChoice,
		]);

		const map = new Map<number, ProgramDemandRow>();

		for (const r of firstRows) {
			map.set(r.programId, {
				programId: r.programId,
				programCode: r.programCode,
				programName: r.programName,
				programLevel: r.programLevel,
				schoolName: r.schoolName,
				schoolId: r.schoolId,
				firstChoice: r.cnt,
				secondChoice: 0,
				total: r.cnt,
			});
		}

		for (const r of secondRows) {
			const existing = map.get(r.programId);
			if (existing) {
				existing.secondChoice = r.cnt;
				existing.total = existing.firstChoice + r.cnt;
			} else {
				map.set(r.programId, {
					programId: r.programId,
					programCode: r.programCode,
					programName: r.programName,
					programLevel: r.programLevel,
					schoolName: r.schoolName,
					schoolId: r.schoolId,
					firstChoice: 0,
					secondChoice: r.cnt,
					total: r.cnt,
				});
			}
		}

		return Array.from(map.values()).sort((a, b) => b.total - a.total);
	}

	async getDemandBySchool(
		filter: AdmissionReportFilter
	): Promise<SchoolDemandRow[]> {
		const conditions = buildConditions(filter);
		const scoreConditions = buildScoreConditions(filter);

		const schoolFilter = filter.schoolIds?.length
			? inArray(programs.schoolId, filter.schoolIds)
			: undefined;
		const levelFilter = filter.programLevels?.length
			? inArray(programs.level, filter.programLevels)
			: undefined;

		const allFilters = [schoolFilter, levelFilter].filter(Boolean);

		const rows = await db
			.select({
				schoolId: schools.id,
				schoolName: schools.code,
				count: count(),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(
				applicationScores,
				eq(applications.id, applicationScores.applicationId)
			)
			.where(and(...conditions, ...scoreConditions, ...allFilters) || undefined)
			.groupBy(schools.id, schools.code)
			.orderBy(desc(count()), schools.code);

		return rows;
	}
}
