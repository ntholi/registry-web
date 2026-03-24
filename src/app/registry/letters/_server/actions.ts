'use server';

import type { DashboardRole } from '@/core/auth/permissions';
import type { letterRecipients, letterTemplates } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import {
	letterRecipientsService,
	lettersService,
	letterTemplatesService,
} from './service';

type LetterTemplate = typeof letterTemplates.$inferInsert;
type LetterRecipient = typeof letterRecipients.$inferInsert;

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

export async function getRecipientsByTemplate(templateId: string) {
	return letterRecipientsService.findByTemplate(templateId);
}

export const createRecipient = createAction(async (data: LetterRecipient) =>
	letterRecipientsService.create(data)
);

export const deleteRecipient = createAction(async (id: string) => {
	await letterRecipientsService.delete(id);
});

export async function getLettersByTemplate(
	templateId: string,
	page = 1,
	search = ''
) {
	return lettersService.findByTemplate(templateId, page, search);
}

export async function getLetters(page = 1, search = '') {
	return lettersService.findWithRelations(page, search);
}

export async function getLetter(id: string) {
	return lettersService.getWithRelations(id);
}

export async function getLettersByStudent(
	stdNo: number,
	page = 1,
	search = ''
) {
	return lettersService.findByStudent(stdNo, page, search);
}

export async function getStudentForLetter(stdNo: number) {
	return lettersService.getStudentForLetter(stdNo);
}

export const generateLetter = createAction(
	async (
		templateId: string,
		stdNo: number,
		opts: { recipientId?: string; salutation?: string; statusId?: string }
	) => lettersService.generate(templateId, stdNo, opts)
);

export const deleteLetter = createAction(async (id: string) => {
	await lettersService.delete(id);
});
