import { and, count, eq, inArray, type SQL } from 'drizzle-orm';
import { applications, db, programs, schools } from '@/core/database';
import type { AdmissionReportFilter } from '../../_shared/types';

export interface ProgramDemandRow {
	programId: number;
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

export class ProgramDemandRepository {
	async getProgramDemand(
		filter: AdmissionReportFilter
	): Promise<ProgramDemandRow[]> {
		const conditions = buildConditions(filter);

		const schoolFilter = filter.schoolIds?.length
			? inArray(programs.schoolId, filter.schoolIds)
			: undefined;
		const levelFilter = filter.programLevels?.length
			? inArray(programs.level, filter.programLevels)
			: undefined;
		const programFilter = filter.programId
			? eq(programs.id, filter.programId)
			: undefined;

		const firstChoice = db
			.select({
				programId: programs.id,
				programName: programs.name,
				programLevel: programs.level,
				schoolName: schools.code,
				schoolId: schools.id,
				cnt: count().as('cnt'),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(
				and(
					...conditions,
					...[schoolFilter, levelFilter, programFilter].filter(Boolean)
				) || undefined
			)
			.groupBy(
				programs.id,
				programs.name,
				programs.level,
				schools.id,
				schools.code
			);

		const secondChoice = db
			.select({
				programId: programs.id,
				programName: programs.name,
				programLevel: programs.level,
				schoolName: schools.code,
				schoolId: schools.id,
				cnt: count().as('cnt'),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.secondChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(
				and(
					...conditions,
					...[schoolFilter, levelFilter, programFilter].filter(Boolean)
				) || undefined
			)
			.groupBy(
				programs.id,
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

		const schoolFilter = filter.schoolIds?.length
			? inArray(programs.schoolId, filter.schoolIds)
			: undefined;
		const levelFilter = filter.programLevels?.length
			? inArray(programs.level, filter.programLevels)
			: undefined;

		const rows = await db
			.select({
				schoolId: schools.id,
				schoolName: schools.code,
				count: count(),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(
				and(...conditions, ...[schoolFilter, levelFilter].filter(Boolean)) ||
					undefined
			)
			.groupBy(schools.id, schools.code)
			.orderBy(schools.code);

		return rows;
	}
}
