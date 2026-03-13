import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { librarySettings } from '../_schema/librarySettings';
import { LibrarySettingsRepository } from './repository';

class LibrarySettingsService extends BaseService<typeof librarySettings, 'id'> {
	declare repository: LibrarySettingsRepository;

	constructor() {
		super(new LibrarySettingsRepository(), {
			byIdAuth: { library: ['read'] },
			findAllAuth: { library: ['read'] },
			createAuth: { library: ['create'] },
			updateAuth: { library: ['update'] },
			deleteAuth: { library: ['delete'] },
			activityTypes: {
				update: 'library_settings_updated',
			},
		});
	}

	async getSettings() {
		return withPermission(
			async () => {
				return await this.repository.getSettings();
			},
			{ library: ['read'] }
		);
	}

	async updateSettings(data: Partial<typeof librarySettings.$inferInsert>) {
		return withPermission(
			async (session) => {
				if (!session?.user?.id) throw new Error('Unauthorized');
				return await this.repository.updateSettings(data, session.user.id);
			},
			{ library: ['update'] }
		);
	}
}

export const librarySettingsService = serviceWrapper(
	LibrarySettingsService,
	'library-settings'
);
