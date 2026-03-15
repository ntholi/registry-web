'use server';

import type { feedbackQuestions } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { feedbackQuestionsService as service } from './service';

type Question = typeof feedbackQuestions.$inferInsert;

export const getQuestions = createAction(
	async (page: number = 1, search: string = '') =>
		service.findAll({
			page,
			search: search.trim(),
			searchColumns: ['text'],
		})
);

export const getAllQuestionsWithCategories = createAction(async () =>
	service.findAllWithCategories()
);

export const getQuestionBoard = createAction(async () =>
	service.findQuestionBoard()
);

export const getQuestion = createAction(async (id: string) => service.get(id));

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
