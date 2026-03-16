'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
import type { librarySettings } from '../_schema/librarySettings';
import { librarySettingsService } from './service';

export async function getLibrarySettings() {
	return await librarySettingsService.getSettings();
}

export const updateLibrarySettings = createAction(
	async (data: Partial<typeof librarySettings.$inferInsert>) =>
		librarySettingsService.updateSettings(data)
);
