import type { terms } from '@/core/database';
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

	async getByCode(code: string) {
		return withAuth(
			async () => (this.repository as TermRepository).getByCode(code),
			['all']
		);
	}

	async getActive() {
		return withAuth(
			async () => (this.repository as TermRepository).getActive(),
			['all']
		);
	}

	async create(data: TermInsert) {
		return withAuth(
			async (session) =>
				(this.repository as TermRepository).create(data, session?.user?.id),
			[]
		);
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
