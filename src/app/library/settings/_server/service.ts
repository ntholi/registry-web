import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { librarySettings } from '../_schema/librarySettings';
import { LibrarySettingsRepository } from './repository';

class LibrarySettingsService extends BaseService<typeof librarySettings, 'id'> {
	declare repository: LibrarySettingsRepository;

	constructor() {
		super(new LibrarySettingsRepository(), {
			updateRoles: ['admin', 'library'],
			activityTypes: {
				update: 'library_settings_updated',
			},
		});
	}

	async getSettings() {
		return withAuth(async () => {
			return await this.repository.getSettings();
		}, ['all']);
	}

	async updateSettings(data: Partial<typeof librarySettings.$inferInsert>) {
		return withAuth(
			async (session) => {
				if (!session?.user?.id) throw new Error('Unauthorized');
				return await this.repository.updateSettings(data, session.user.id);
			},
			['admin', 'library']
		);
	}
}

export const librarySettingsService = serviceWrapper(
	LibrarySettingsService,
	'library-settings'
);
