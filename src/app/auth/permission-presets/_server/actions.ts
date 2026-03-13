'use server';

import { z } from 'zod/v4';
import { dashboardRoleSchema, presetFormSchema } from '../_lib/types';
import { permissionPresetService as service } from './service';

const idSchema = z.string().min(1);

export async function getPreset(id: string) {
	return service.get(idSchema.parse(id));
}

export async function findAllPresets(page = 1, search = '') {
	return service.findAllWithCounts({
		page,
		search: search.trim(),
		searchColumns: ['name', 'role', 'description'],
	});
}

export async function findPresetsByRole(role: string) {
	return service.findByRole(dashboardRoleSchema.parse(role));
}

export async function createPreset(data: unknown) {
	return service.create(presetFormSchema.parse(data));
}

export async function updatePreset(id: string, data: unknown) {
	return service.update(idSchema.parse(id), presetFormSchema.parse(data));
}

export async function deletePreset(id: string) {
	return service.delete(idSchema.parse(id));
}
