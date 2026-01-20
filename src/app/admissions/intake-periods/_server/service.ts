import type { intakePeriods } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import IntakePeriodRepository from './repository';

class IntakePeriodService extends BaseService<typeof intakePeriods, 'id'> {
	private repo: IntakePeriodRepository;

	constructor() {
		const repo = new IntakePeriodRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['registry', 'marketing', 'admin'],
		});
		this.repo = repo;
	}

	async findActive() {
		return withAuth(
			async () => this.repo.findActive(),
			['registry', 'marketing', 'admin']
		);
	}

	async findAllActive() {
		return withAuth(
			async () => this.repo.findAllActive(),
			['registry', 'marketing', 'admin']
		);
	}

	override async create(data: typeof intakePeriods.$inferInsert) {
		return withAuth(async () => {
			const overlap = await this.repo.findOverlapping(
				data.startDate,
				data.endDate
			);
			if (overlap) {
				throw new Error(
					'INTAKE_PERIOD_OVERLAP: Intake period dates overlap with existing period'
				);
			}
			return this.repo.create(data);
		}, ['registry', 'marketing', 'admin']);
	}

	override async update(
		id: string,
		data: Partial<typeof intakePeriods.$inferInsert>
	) {
		return withAuth(async () => {
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
			return this.repo.update(id, data);
		}, ['registry', 'marketing', 'admin']);
	}

	override async delete(id: string) {
		return withAuth(async () => {
			const hasApps = await this.repo.hasApplications(id);
			if (hasApps) {
				throw new Error(
					'INTAKE_PERIOD_HAS_APPLICATIONS: Cannot delete intake period with applications'
				);
			}
			return this.repo.delete(id);
		}, ['registry', 'marketing', 'admin']);
	}
}

export const intakePeriodsService = serviceWrapper(
	IntakePeriodService,
	'IntakePeriodService'
);
