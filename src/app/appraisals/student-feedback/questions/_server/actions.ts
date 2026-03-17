'use server';

import type { studentFeedbackQuestions } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { studentFeedbackQuestionsService as service } from './service';

type Question = typeof studentFeedbackQuestions.$inferInsert;

export async function getQuestions(page = 1, search = '') {
	return service.findAll({
		page,
		search: search.trim(),
		searchColumns: ['text'],
	});
}

export async function getAllQuestionsWithCategories() {
	return service.findAllWithCategories();
}

export async function getQuestionBoard() {
	return service.findQuestionBoard();
}

export async function getQuestion(id: string) {
	return service.get(id);
}

export const createQuestion = createAction(async (data: Question) =>
	service.create(data)
);

export const updateQuestion = createAction(
	async (id: string, data: Partial<Question>) => service.update(id, data)
);

export const deleteQuestion = createAction(async (id: string) =>
	service.delete(id)
);

export const reorderQuestions = createAction(async (ids: string[]) =>
	service.reorderQuestions(ids)
);

export const reorderCategories = createAction(async (ids: string[]) =>
	service.reorderCategories(ids)
);
