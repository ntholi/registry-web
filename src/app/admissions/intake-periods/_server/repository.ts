import { and, count, eq, gte, lte, ne, or } from 'drizzle-orm';
import { applications, db, intakePeriods } from '@/core/database';
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

	async findOverlapping(
		startDate: string,
		endDate: string,
		excludeId?: number
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

	async hasApplications(id: number) {
		const [result] = await db
			.select({ total: count() })
			.from(applications)
			.where(eq(applications.intakePeriodId, id));
		return result.total > 0;
	}
}
