'use server';

import type { librarySettings } from '../_schema/librarySettings';
import { librarySettingsService } from './service';

export async function getLibrarySettings() {
	return await librarySettingsService.getSettings();
}

export async function updateLibrarySettings(
	data: Partial<typeof librarySettings.$inferInsert>
) {
	return await librarySettingsService.updateSettings(data);
}
