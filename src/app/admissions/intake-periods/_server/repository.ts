import { and, count, eq, gte, lte, ne, or } from 'drizzle-orm';
import {
	applications,
	db,
	intakePeriodPrograms,
	intakePeriods,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class IntakePeriodRepository extends BaseRepository<
	typeof intakePeriods,
	'id'
> {
	constructor() {
		super(intakePeriods, intakePeriods.id);
	}

	async findActive() {
		const today = new Date().toISOString().split('T')[0];
		return db.query.intakePeriods.findFirst({
			where: and(
				lte(intakePeriods.startDate, today),
				gte(intakePeriods.endDate, today)
			),
		});
	}

	async findAllActive() {
		const today = new Date().toISOString().split('T')[0];
		return db.query.intakePeriods.findMany({
			where: and(
				lte(intakePeriods.startDate, today),
				gte(intakePeriods.endDate, today)
			),
			orderBy: (ip, { desc }) => [desc(ip.startDate)],
		});
	}

	async findWithPrograms(id: string) {
		return db.query.intakePeriods.findFirst({
			where: eq(intakePeriods.id, id),
			with: {
				intakePeriodPrograms: {
					with: { program: true },
				},
			},
		});
	}

	async getProgramIds(intakePeriodId: string) {
		const rows = await db
			.select({ programId: intakePeriodPrograms.programId })
			.from(intakePeriodPrograms)
			.where(eq(intakePeriodPrograms.intakePeriodId, intakePeriodId));
		return rows.map((r) => r.programId);
	}

	async setProgramIds(intakePeriodId: string, programIds: number[]) {
		await db.transaction(async (tx) => {
			await tx
				.delete(intakePeriodPrograms)
				.where(eq(intakePeriodPrograms.intakePeriodId, intakePeriodId));

			if (programIds.length > 0) {
				await tx.insert(intakePeriodPrograms).values(
					programIds.map((programId) => ({
						intakePeriodId,
						programId,
					}))
				);
			}
		});
	}

	async getOpenProgramIds(intakePeriodId: string) {
		const rows = await db
			.select({ programId: intakePeriodPrograms.programId })
			.from(intakePeriodPrograms)
			.where(eq(intakePeriodPrograms.intakePeriodId, intakePeriodId));
		return rows.map((r) => r.programId);
	}

	async findOverlapping(
		startDate: string,
		endDate: string,
		excludeId?: string
	) {
		const baseCondition = or(
			and(
				lte(intakePeriods.startDate, startDate),
				gte(intakePeriods.endDate, startDate)
			),
			and(
				lte(intakePeriods.startDate, endDate),
				gte(intakePeriods.endDate, endDate)
			),
			and(
				gte(intakePeriods.startDate, startDate),
				lte(intakePeriods.endDate, endDate)
			)
		);

		const where = excludeId
			? and(baseCondition, ne(intakePeriods.id, excludeId))
			: baseCondition;

		return db.query.intakePeriods.findFirst({ where });
	}

	async hasApplications(id: string) {
		const [result] = await db
			.select({ total: count() })
			.from(applications)
			.where(eq(applications.intakePeriodId, id));
		return result.total > 0;
	}
}
