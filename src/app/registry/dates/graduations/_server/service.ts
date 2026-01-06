import type { graduations } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import GraduationRepository from './repository';

class GraduationService extends BaseService<typeof graduations, 'id'> {
	constructor() {
		super(new GraduationRepository(), {
			findAllRoles: ['dashboard'],
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

	async deleteGraduation(id: number) {
		const graduation = await this.repository.findById(id);
		await this.repository.delete(id);
		return graduation;
	}
}

export const graduationsService = serviceWrapper(
	GraduationService,
	'GraduationsService'
);
