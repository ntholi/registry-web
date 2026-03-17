import { asc, eq } from 'drizzle-orm';
import {
	db,
	observationCategories,
	observationCriteria,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

interface CategoryWithCriteria {
	id: string;
	name: string;
	section: 'teaching_observation' | 'assessments' | 'other';
	sortOrder: number;
	criteriaCount: number;
	criteria: Array<{
		id: string;
		categoryId: string;
		text: string;
		description: string | null;
		sortOrder: number;
	}>;
}

export default class ObservationCriteriaRepository extends BaseRepository<
	typeof observationCategories,
	'id'
> {
	constructor() {
		super(observationCategories, observationCategories.id);
	}

	async getCategoriesWithCriteria(): Promise<CategoryWithCriteria[]> {
		const rows = await db
			.select({
				categoryId: observationCategories.id,
				categoryName: observationCategories.name,
				categorySection: observationCategories.section,
				categorySortOrder: observationCategories.sortOrder,
				criterionId: observationCriteria.id,
				criterionText: observationCriteria.text,
				criterionDescription: observationCriteria.description,
				criterionSortOrder: observationCriteria.sortOrder,
			})
			.from(observationCategories)
			.leftJoin(
				observationCriteria,
				eq(observationCriteria.categoryId, observationCategories.id)
			)
			.orderBy(
				asc(observationCategories.section),
				asc(observationCategories.sortOrder),
				asc(observationCriteria.sortOrder)
			);

		const resultMap = new Map<string, CategoryWithCriteria>();

		for (const row of rows) {
			const existing = resultMap.get(row.categoryId);

			if (!existing) {
				resultMap.set(row.categoryId, {
					id: row.categoryId,
					name: row.categoryName,
					section: row.categorySection,
					sortOrder: row.categorySortOrder,
					criteriaCount: row.criterionId ? 1 : 0,
					criteria: row.criterionId
						? [
								{
									id: row.criterionId,
									categoryId: row.categoryId,
									text: row.criterionText ?? '',
									description: row.criterionDescription ?? null,
									sortOrder: row.criterionSortOrder ?? 0,
								},
							]
						: [],
				});
				continue;
			}

			if (row.criterionId) {
				existing.criteria.push({
					id: row.criterionId,
					categoryId: row.categoryId,
					text: row.criterionText ?? '',
					description: row.criterionDescription ?? null,
					sortOrder: row.criterionSortOrder ?? 0,
				});
				existing.criteriaCount += 1;
			}
		}

		return Array.from(resultMap.values());
	}

	async createCriterion(data: typeof observationCriteria.$inferInsert) {
		const [result] = await db
			.insert(observationCriteria)
			.values(data)
			.returning();
		return result;
	}

	async updateCriterion(
		id: string,
		data: Partial<typeof observationCriteria.$inferInsert>
	) {
		const [result] = await db
			.update(observationCriteria)
			.set(data)
			.where(eq(observationCriteria.id, id))
			.returning();
		return result;
	}

	async deleteCriterion(id: string) {
		const [result] = await db
			.delete(observationCriteria)
			.where(eq(observationCriteria.id, id))
			.returning();
		return result;
	}

	async reorderCategories(ids: string[]) {
		await db.transaction(async (tx) => {
			for (let i = 0; i < ids.length; i++) {
				await tx
					.update(observationCategories)
					.set({ sortOrder: i })
					.where(eq(observationCategories.id, ids[i]));
			}
		});
	}

	async reorderCriteria(orderedIds: string[]) {
		await db.transaction(async (tx) => {
			for (let i = 0; i < orderedIds.length; i++) {
				await tx
					.update(observationCriteria)
					.set({ sortOrder: i })
					.where(eq(observationCriteria.id, orderedIds[i]));
			}
		});
	}
}
