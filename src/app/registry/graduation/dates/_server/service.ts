import type { graduationDates } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import GraduationRepository from './repository';

class GraduationService extends BaseService<typeof graduationDates, 'id'> {
	constructor() {
		super(new GraduationRepository(), {
			findAllRoles: ['dashboard'],
			activityTypes: {
				create: 'graduation_date_created',
				update: 'graduation_date_updated',
			},
		});
	}

	async getWithTerm(id: number) {
		return withAuth(
			async () => (this.repository as GraduationRepository).findById(id),
			['dashboard']
		);
	}

	async getByDateWithTerm(date: string) {
		return withAuth(
			async () => (this.repository as GraduationRepository).findByDate(date),
			['dashboard']
		);
	}

	async getLatest() {
		return withAuth(
			async () => (this.repository as GraduationRepository).findLatest(),
			['dashboard']
		);
	}

	async getAllGraduationDates() {
		return withAuth(
			async () => (this.repository as GraduationRepository).findAll(),
			['dashboard']
		);
	}

	async deleteGraduation(id: number) {
		return withAuth(
			async (session) => {
				const graduation = await this.repository.findById(id);
				await this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'graduation_date_deleted',
				});
				return graduation;
			},
			['registry', 'admin']
		);
	}
}

export const graduationsService = serviceWrapper(
	GraduationService,
	'GraduationsService'
);
