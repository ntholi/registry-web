import type { terms } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import TermRepository, { type TermInsert } from './repository';

class TermService extends BaseService<typeof terms, 'id'> {
	constructor() {
		super(new TermRepository(), {
			findAllRoles: ['dashboard'],
			activityTypes: {
				create: 'term_created',
				update: 'term_updated',
			},
		});
	}

	async getByCode(code: string) {
		return withPermission(
			async () => (this.repository as TermRepository).getByCode(code),
			['all']
		);
	}

	async getActive() {
		return withPermission(
			async () => (this.repository as TermRepository).getActive(),
			['all']
		);
	}

	async create(data: TermInsert) {
		return withPermission(
			async (session) =>
				(this.repository as TermRepository).createWithSettings(
					data,
					session?.user?.id
				),
			[]
		);
	}

	async deleteTerm(id: number) {
		return withPermission(async () => {
			const term = await this.repository.findById(id);
			await this.repository.delete(id);
			return term;
		}, []);
	}
}

export const termsService = serviceWrapper(TermService, 'TermsService');
