import type { terms } from '@/core/database/schema';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import TermRepository, { type TermInsert } from './repository';

class TermService extends BaseService<typeof terms, 'id'> {
	constructor() {
		super(new TermRepository(), {
			findAllRoles: ['dashboard'],
		});
	}

	async getActive() {
		return withAuth(async () => (this.repository as TermRepository).getActive(), ['all']);
	}

	async deleteTerm(id: number) {
		return withAuth(async () => {
			const term = await this.repository.findById(id);
			await this.repository.delete(id);
			return term;
		}, []);
	}
}

export const termsService = serviceWrapper(TermService, 'TermsService');
