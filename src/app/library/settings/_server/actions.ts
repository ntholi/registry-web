'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { librarySettings } from '../_schema/librarySettings';
import { librarySettingsService } from './service';

export const getLibrarySettings = createAction(async () => {
	return await librarySettingsService.getSettings();
});

export const updateLibrarySettings = createAction(
	async (data: Partial<typeof librarySettings.$inferInsert>) => {
		return await librarySettingsService.updateSettings(data);
	}
);
