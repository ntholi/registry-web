import { getUserSchoolIds } from '@admin/users/_server/actions';
import type { observations } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import ObservationRepository from './repository';

const perm = 'teaching-observations' as const;

class ObservationService extends BaseService<typeof observations, 'id'> {
	private repo: ObservationRepository;

	constructor() {
		const repo = new ObservationRepository();
		super(repo, {
			findAllAuth: { [perm]: ['read'] },
			byIdAuth: { [perm]: ['read'] },
			createAuth: { [perm]: ['create'] },
			updateAuth: { [perm]: ['update'] },
			deleteAuth: { [perm]: ['delete'] },
			activityTypes: {
				create: 'teaching_observation_created',
				update: 'teaching_observation_updated',
				delete: 'teaching_observation_deleted',
			},
		});
		this.repo = repo;
	}

	async queryObservations(
		params: Parameters<typeof this.repo.queryObservations>[0],
		filters?: Parameters<typeof this.repo.queryObservations>[1]
	) {
		return withPermission(
			async () => this.repo.queryObservations(params, filters),
			{ [perm]: ['read'] }
		);
	}

	async findObservation(id: string) {
		return withPermission(async () => this.repo.findById(id), {
			[perm]: ['read'],
		});
	}

	async createWithRatings(
		data: typeof observations.$inferInsert,
		criterionIds: string[]
	) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'create');
				return this.repo.createWithRatings(data, criterionIds, audit);
			},
			{ [perm]: ['create'] }
		);
	}

	async updateWithRatings(
		id: string,
		data: Partial<typeof observations.$inferInsert>,
		ratings: Array<{ criterionId: string; rating: number | null }>
	) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'update');
				return this.repo.updateWithRatings(id, data, ratings, audit);
			},
			{ [perm]: ['update'] }
		);
	}

	async submit(id: string) {
		return withPermission(
			async (session) => {
				const obs = await this.repo.findById(id);
				if (!obs) throw new UserFacingError('Observation not found');
				if (obs.status !== 'draft')
					throw new UserFacingError('Only draft observations can be submitted');

				const allRated = obs.ratings.every((r) => r.rating != null);
				if (!allRated)
					throw new UserFacingError(
						'All criteria must be rated before submitting'
					);

				const audit = this.buildAuditOptions(session, 'update');
				return this.repo.submit(id, audit);
			},
			{ [perm]: ['update'] }
		);
	}

	async acknowledge(id: string, comment: string | null) {
		return withPermission(async (session) => {
			const obs = await this.repo.findById(id);
			if (!obs) throw new UserFacingError('Observation not found');
			if (obs.status !== 'submitted')
				throw new UserFacingError(
					'Only submitted observations can be acknowledged'
				);

			const lecturerId = obs.assignedModule?.user?.id;
			if (lecturerId !== session?.user?.id)
				throw new UserFacingError('Only the observed lecturer can acknowledge');

			const audit = this.buildAuditOptions(session, 'update');
			return this.repo.acknowledge(id, comment, audit);
		}, 'auth');
	}

	async findForLecturer(
		userId: string,
		params: Parameters<typeof this.repo.findByLecturer>[1]
	) {
		return withPermission(
			async () => this.repo.findByLecturer(userId, params),
			'auth'
		);
	}

	async getActiveCycles() {
		return withPermission(
			async (session) => {
				const schoolIds = await getUserSchoolIds(session?.user?.id);
				return this.repo.getActiveCycles(schoolIds);
			},
			{ [perm]: ['read'] }
		);
	}

	async getLecturersForSchool(termId: number) {
		return withPermission(
			async (session) => {
				const schoolIds = await getUserSchoolIds(session?.user?.id);
				return this.repo.getLecturersForSchool(schoolIds, termId);
			},
			{ [perm]: ['read'] }
		);
	}

	async getAssignedModulesForLecturer(userId: string, termId: number) {
		return withPermission(
			async () => this.repo.getAssignedModulesForLecturer(userId, termId),
			{ [perm]: ['read'] }
		);
	}

	async checkExists(cycleId: string, assignedModuleId: number) {
		return withPermission(
			async () => this.repo.checkExists(cycleId, assignedModuleId),
			{ [perm]: ['read'] }
		);
	}

	async getAllCriteria() {
		return withPermission(async () => this.repo.getAllCriteria(), {
			[perm]: ['read'],
		});
	}
}

export const observationService = serviceWrapper(
	ObservationService,
	'ObservationService'
);
