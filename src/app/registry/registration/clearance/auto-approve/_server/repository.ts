import { and, count, desc, eq, sql } from 'drizzle-orm';
import { autoApprovals, type DashboardUser, db, terms } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export default class AutoApprovalRepository extends BaseRepository<
	typeof autoApprovals,
	'id'
> {
	constructor() {
		super(autoApprovals, autoApprovals.id);
	}

	async findAllPaginated(
		params: QueryOptions<typeof autoApprovals>,
		department?: DashboardUser
	) {
		const { offset, limit } = this.buildQueryCriteria(params);

		const whereCondition = and(
			params.search
				? sql`${autoApprovals.stdNo}::text LIKE ${`%${params.search}%`}`
				: undefined,
			department ? eq(autoApprovals.department, department) : undefined
		);

		const [total, items] = await Promise.all([
			db
				.select({ value: count() })
				.from(autoApprovals)
				.where(whereCondition)
				.then((res) => res[0].value),
			db.query.autoApprovals.findMany({
				where: whereCondition,
				with: {
					term: true,
					student: true,
					createdByUser: true,
				},
				limit,
				offset,
				orderBy: [desc(autoApprovals.createdAt)],
			}),
		]);

		return {
			items,
			totalPages: Math.ceil(total / limit),
			totalItems: total,
		};
	}

	async findByIdWithRelations(id: number) {
		return db.query.autoApprovals.findFirst({
			where: eq(autoApprovals.id, id),
			with: {
				term: true,
				student: true,
				createdByUser: true,
			},
		});
	}

	async findMatchingRules(stdNo: number, termId: number) {
		return db.query.autoApprovals.findMany({
			where: and(
				eq(autoApprovals.stdNo, stdNo),
				eq(autoApprovals.termId, termId)
			),
		});
	}

	async bulkCreate(
		rules: { stdNo: number; termId: number; department: DashboardUser }[],
		createdBy: string
	) {
		if (rules.length === 0) return { inserted: 0, skipped: 0 };

		const rulesWithCreator = rules.map((rule) => ({
			...rule,
			createdBy,
		}));

		const result = await db
			.insert(autoApprovals)
			.values(rulesWithCreator)
			.onConflictDoNothing()
			.returning();

		return {
			inserted: result.length,
			skipped: rules.length - result.length,
		};
	}

	async findByTermCode(termCode: string) {
		const term = await db.query.terms.findFirst({
			where: eq(terms.code, termCode),
		});
		if (!term) return null;
		return term;
	}
}
