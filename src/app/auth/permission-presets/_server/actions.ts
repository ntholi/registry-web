'use server';

import { z } from 'zod/v4';
import { createAction } from '@/shared/lib/actions/actionResult';
import {
	dashboardRoleSchema,
	type PresetFormValues,
	presetFormSchema,
} from '../_lib/types';
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

export const createPreset = createAction(async (data: PresetFormValues) =>
	service.create(presetFormSchema.parse(data))
);

export const updatePreset = createAction(
	async (id: string, data: PresetFormValues) =>
		service.update(idSchema.parse(id), presetFormSchema.parse(data))
);

export const deletePreset = createAction(async (id: string) =>
	service.delete(idSchema.parse(id))
);
