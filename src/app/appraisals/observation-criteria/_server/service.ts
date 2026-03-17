import type {
	observationCategories,
	observationCriteria,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import ObservationCriteriaRepository from './repository';

const perm = 'teaching-observation-criteria' as const;

class ObservationCriteriaService extends BaseService<
	typeof observationCategories,
	'id'
> {
	private repo: ObservationCriteriaRepository;

	constructor() {
		const repo = new ObservationCriteriaRepository();
		super(repo, {
			findAllAuth: { [perm]: ['read'] },
			byIdAuth: { [perm]: ['read'] },
			createAuth: { [perm]: ['create'] },
			updateAuth: { [perm]: ['update'] },
			deleteAuth: { [perm]: ['delete'] },
			activityTypes: {
				create: 'observation_criteria_created',
				update: 'observation_criteria_updated',
				delete: 'observation_criteria_deleted',
			},
		});
		this.repo = repo;
	}

	async getCategoriesWithCriteria() {
		return withPermission(async () => this.repo.getCategoriesWithCriteria(), {
			[perm]: ['read'],
		});
	}

	async createCriterion(data: typeof observationCriteria.$inferInsert) {
		return withPermission(async () => this.repo.createCriterion(data), {
			[perm]: ['create'],
		});
	}

	async updateCriterion(
		id: string,
		data: Partial<typeof observationCriteria.$inferInsert>
	) {
		return withPermission(async () => this.repo.updateCriterion(id, data), {
			[perm]: ['update'],
		});
	}

	async deleteCriterion(id: string) {
		return withPermission(async () => this.repo.deleteCriterion(id), {
			[perm]: ['delete'],
		});
	}

	async reorderCategories(ids: string[]) {
		return withPermission(async () => this.repo.reorderCategories(ids), {
			[perm]: ['update'],
		});
	}

	async reorderCriteria(orderedIds: string[]) {
		return withPermission(async () => this.repo.reorderCriteria(orderedIds), {
			[perm]: ['update'],
		});
	}
}

export const observationCriteriaService = serviceWrapper(
	ObservationCriteriaService,
	'ObservationCriteriaService'
);
