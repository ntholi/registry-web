import { and, count, desc, eq, sql } from 'drizzle-orm';
import {
	autoApprovalRules,
	type DashboardUser,
	db,
	terms,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export default class AutoApprovalRuleRepository extends BaseRepository<
	typeof autoApprovalRules,
	'id'
> {
	constructor() {
		super(autoApprovalRules, autoApprovalRules.id);
	}

	async findAllPaginated(
		params: QueryOptions<typeof autoApprovalRules>,
		department?: DashboardUser
	) {
		const { offset, limit } = this.buildQueryCriteria(params);

		const whereCondition = and(
			params.search
				? sql`${autoApprovalRules.stdNo}::text LIKE ${`%${params.search}%`}`
				: undefined,
			department ? eq(autoApprovalRules.department, department) : undefined
		);

		const [total, items] = await Promise.all([
			db
				.select({ value: count() })
				.from(autoApprovalRules)
				.where(whereCondition)
				.then((res) => res[0].value),
			db.query.autoApprovalRules.findMany({
				where: whereCondition,
				with: {
					term: true,
					createdByUser: true,
				},
				limit,
				offset,
				orderBy: [desc(autoApprovalRules.createdAt)],
			}),
		]);

		return {
			items,
			totalPages: Math.ceil(total / limit),
			totalItems: total,
		};
	}

	async findByIdWithRelations(id: number) {
		return db.query.autoApprovalRules.findFirst({
			where: eq(autoApprovalRules.id, id),
			with: {
				term: true,
				createdByUser: true,
			},
		});
	}

	async findMatchingRules(stdNo: number, termId: number) {
		return db.query.autoApprovalRules.findMany({
			where: and(
				eq(autoApprovalRules.stdNo, stdNo),
				eq(autoApprovalRules.termId, termId)
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
			.insert(autoApprovalRules)
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
