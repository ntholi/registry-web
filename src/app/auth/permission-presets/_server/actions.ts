'use server';

import { z } from 'zod/v4';
import { createAction } from '@/shared/lib/utils/actionResult';
import { dashboardRoleSchema, presetFormSchema } from '../_lib/types';
import { permissionPresetService as service } from './service';

const idSchema = z.string().min(1);

export const getPreset = createAction(async (id: string) => {
	return service.get(idSchema.parse(id));
});

export const findAllPresets = createAction(
	async (page: number = 1, search: string = '') => {
		return service.findAllWithCounts({
			page,
			search: search.trim(),
			searchColumns: ['name', 'role', 'description'],
		});
	}
);

export const findPresetsByRole = createAction(async (role: string) => {
	return service.findByRole(dashboardRoleSchema.parse(role));
});

export const createPreset = createAction(async (data: unknown) => {
	return service.create(presetFormSchema.parse(data));
});

export const updatePreset = createAction(async (id: string, data: unknown) => {
	return service.update(idSchema.parse(id), presetFormSchema.parse(data));
});

export const deletePreset = createAction(async (id: string) => {
	return service.delete(idSchema.parse(id));
});
