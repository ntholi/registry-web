'use server';

import type { DashboardRole } from '@/core/auth/permissions';
import type { letterTemplates } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { letterTemplatesService } from './service';

type LetterTemplate = typeof letterTemplates.$inferInsert;

export async function getLetterTemplates(page = 1, search = '') {
	return letterTemplatesService.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'createdAt', order: 'desc' }],
	});
}

export async function getLetterTemplate(id: string) {
	return letterTemplatesService.get(id);
}

export async function getActiveTemplates(role?: DashboardRole) {
	return letterTemplatesService.findAllActive(role);
}

export const createLetterTemplate = createAction(async (data: LetterTemplate) =>
	letterTemplatesService.create(data)
);

export const updateLetterTemplate = createAction(
	async (id: string, data: LetterTemplate) =>
		letterTemplatesService.update(id, data)
);

export const deleteLetterTemplate = createAction(async (id: string) => {
	await letterTemplatesService.delete(id);
});

export const toggleTemplateActive = createAction(async (id: string) => {
	const template = await letterTemplatesService.get(id);
	return letterTemplatesService.update(id, { isActive: !template?.isActive });
});
