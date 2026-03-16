import { hasPermission } from '@/core/auth/sessionPermissions';
import type { terms } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import TermRepository, { type TermInsert } from './repository';

class TermService extends BaseService<typeof terms, 'id'> {
	constructor() {
		super(new TermRepository(), {
			findAllAuth: 'dashboard',
			createAuth: async (session) =>
				hasPermission(session, 'terms-settings', 'update') ||
				session?.user?.role === 'registry',
			updateAuth: async (session) =>
				hasPermission(session, 'terms-settings', 'update') ||
				session?.user?.role === 'registry',
			activityTypes: {
				create: 'term_created',
				update: 'term_updated',
			},
		});
	}

	async getByCode(code: string) {
		return withPermission(
			async () => (this.repository as TermRepository).getByCode(code),
			'all'
		);
	}

	async getActive() {
		return withPermission(
			async () => (this.repository as TermRepository).getActive(),
			'all'
		);
	}

	async getActiveOrThrow() {
		const term = await this.getActive();
		if (!term) {
			throw new UserFacingError('No active term', 'NO_ACTIVE_TERM');
		}
		return term;
	}

	async create(data: TermInsert) {
		return withPermission(
			async (session) =>
				(this.repository as TermRepository).createWithSettings(
					data,
					session?.user?.id
				),
			async (session) =>
				hasPermission(session, 'terms-settings', 'update') ||
				session?.user?.role === 'registry'
		);
	}

	async deleteTerm(id: number) {
		return withPermission(
			async () => {
				const term = await this.repository.findById(id);
				await this.repository.delete(id);
				return term;
			},
			async (session) =>
				hasPermission(session, 'terms-settings', 'update') ||
				session?.user?.role === 'registry'
		);
	}
}

export const termsService = serviceWrapper(TermService, 'TermsService');
