import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import type { intakePeriods } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import IntakePeriodRepository from './repository';

class IntakePeriodService extends BaseService<typeof intakePeriods, 'id'> {
	private repo: IntakePeriodRepository;

	constructor() {
		const repo = new IntakePeriodRepository();
		super(repo, {
			byIdAuth: { 'intake-periods': ['read'] },
			findAllAuth: { 'intake-periods': ['read'] },
			createAuth: { 'intake-periods': ['create'] },
			updateAuth: { 'intake-periods': ['update'] },
			deleteAuth: { 'intake-periods': ['delete'] },
			activityTypes: {
				create: 'intake_period_created',
				update: 'intake_period_updated',
				delete: 'intake_period_deleted',
			},
		});
		this.repo = repo;
	}

	async findActive() {
		return withPermission(async () => this.repo.findActive(), 'all');
	}

	async findAllActive() {
		return withPermission(async () => this.repo.findAllActive(), {
			'intake-periods': ['read'],
		});
	}

	async findWithPrograms(id: string) {
		return withPermission(async () => this.repo.findWithPrograms(id), {
			'intake-periods': ['read'],
		});
	}

	async getProgramIds(intakePeriodId: string) {
		return withPermission(async () => this.repo.getProgramIds(intakePeriodId), {
			'intake-periods': ['read'],
		});
	}

	async setProgramIds(intakePeriodId: string, programIds: number[]) {
		return withPermission(
			async () => this.repo.setProgramIds(intakePeriodId, programIds),
			{ 'intake-periods': ['update'] }
		);
	}

	async getOpenProgramIds(intakePeriodId: string) {
		return withPermission(
			async () => this.repo.getOpenProgramIds(intakePeriodId),
			async (session) =>
				hasSessionPermission(session, 'intake-periods', 'read', [
					'applicant',
					'user',
				])
		);
	}

	override async create(data: typeof intakePeriods.$inferInsert) {
		return withPermission(
			async (session) => {
				const overlap = await this.repo.findOverlapping(
					data.startDate,
					data.endDate
				);
				if (overlap) {
					throw new Error(
						'INTAKE_PERIOD_OVERLAP: Intake period dates overlap with existing period'
					);
				}
				return this.repo.create(
					data,
					this.buildAuditOptions(session, 'create')
				);
			},
			{ 'intake-periods': ['create'] }
		);
	}

	override async update(
		id: string,
		data: Partial<typeof intakePeriods.$inferInsert>
	) {
		return withPermission(
			async (session) => {
				if (data.startDate && data.endDate) {
					const overlap = await this.repo.findOverlapping(
						data.startDate,
						data.endDate,
						id
					);
					if (overlap) {
						throw new Error(
							'INTAKE_PERIOD_OVERLAP: Intake period dates overlap with existing period'
						);
					}
				}
				return this.repo.update(
					id,
					data,
					this.buildAuditOptions(session, 'update')
				);
			},
			{ 'intake-periods': ['update'] }
		);
	}

	override async delete(id: string) {
		return withPermission(
			async (session) => {
				const hasApps = await this.repo.hasApplications(id);
				if (hasApps) {
					throw new Error(
						'INTAKE_PERIOD_HAS_APPLICATIONS: Cannot delete intake period with applications'
					);
				}
				return this.repo.delete(id, this.buildAuditOptions(session, 'delete'));
			},
			{ 'intake-periods': ['delete'] }
		);
	}
}

export const intakePeriodsService = serviceWrapper(
	IntakePeriodService,
	'IntakePeriodService'
);
