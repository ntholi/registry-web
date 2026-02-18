import { and, count, eq, sql } from 'drizzle-orm';
import {
	db,
	feedbackPassphrases,
	feedbackPeriods,
	programs,
	schools,
	structureSemesters,
	structures,
	studentSemesters,
	terms,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class FeedbackPeriodRepository extends BaseRepository<
	typeof feedbackPeriods,
	'id'
> {
	constructor() {
		super(feedbackPeriods, feedbackPeriods.id);
	}

	override async findById(id: number) {
		return db.query.feedbackPeriods.findFirst({
			where: eq(feedbackPeriods.id, id),
			with: { term: true },
		});
	}

	async getClassesForTerm(termId: number) {
		const term = await db.query.terms.findFirst({
			where: eq(terms.id, termId),
		});
		if (!term) return [];

		const rows = await db
			.select({
				structureSemesterId: structureSemesters.id,
				semesterNumber: structureSemesters.semesterNumber,
				structureId: structures.id,
				programCode: programs.code,
				programName: programs.name,
				schoolId: schools.id,
				schoolName: schools.name,
				studentCount: count(studentSemesters.id),
			})
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(eq(studentSemesters.termCode, term.code))
			.groupBy(
				structureSemesters.id,
				structureSemesters.semesterNumber,
				structures.id,
				programs.code,
				programs.name,
				schools.id,
				schools.name
			)
			.orderBy(schools.name, programs.code, structureSemesters.semesterNumber);

		const grouped = new Map<
			number,
			{
				schoolId: number;
				schoolName: string;
				classes: {
					structureSemesterId: number;
					semesterNumber: string;
					programCode: string;
					programName: string;
					studentCount: number;
				}[];
			}
		>();

		for (const row of rows) {
			if (!grouped.has(row.schoolId)) {
				grouped.set(row.schoolId, {
					schoolId: row.schoolId,
					schoolName: row.schoolName,
					classes: [],
				});
			}
			grouped.get(row.schoolId)!.classes.push({
				structureSemesterId: row.structureSemesterId,
				semesterNumber: row.semesterNumber,
				programCode: row.programCode,
				programName: row.programName,
				studentCount: row.studentCount,
			});
		}

		return Array.from(grouped.values());
	}

	async getPassphraseStats(periodId: number) {
		const rows = await db
			.select({
				structureSemesterId: feedbackPassphrases.structureSemesterId,
				total: count(feedbackPassphrases.id),
				used: sql<number>`count(case when ${feedbackPassphrases.used} = true then 1 end)`.as(
					'used'
				),
			})
			.from(feedbackPassphrases)
			.where(eq(feedbackPassphrases.periodId, periodId))
			.groupBy(feedbackPassphrases.structureSemesterId);

		const result: Record<
			number,
			{ total: number; used: number; remaining: number }
		> = {};
		for (const row of rows) {
			result[row.structureSemesterId] = {
				total: row.total,
				used: row.used,
				remaining: row.total - row.used,
			};
		}
		return result;
	}

	async getExistingPassphrases(periodId: number) {
		const rows = await db
			.select({ passphrase: feedbackPassphrases.passphrase })
			.from(feedbackPassphrases)
			.where(eq(feedbackPassphrases.periodId, periodId));

		return new Set(rows.map((r) => r.passphrase));
	}

	async createPassphrases(
		passphrases: {
			periodId: number;
			structureSemesterId: number;
			passphrase: string;
		}[]
	) {
		if (passphrases.length === 0) return;
		await db.insert(feedbackPassphrases).values(passphrases);
	}

	async getPassphrasesForClass(periodId: number, structureSemesterId: number) {
		return db
			.select({ passphrase: feedbackPassphrases.passphrase })
			.from(feedbackPassphrases)
			.where(
				and(
					eq(feedbackPassphrases.periodId, periodId),
					eq(feedbackPassphrases.structureSemesterId, structureSemesterId)
				)
			)
			.orderBy(feedbackPassphrases.id);
	}
}

export const feedbackPeriodRepository = new FeedbackPeriodRepository();
