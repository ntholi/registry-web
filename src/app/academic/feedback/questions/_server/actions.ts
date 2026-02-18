'use server';

import type { feedbackQuestions } from '@/core/database';
import { feedbackQuestionsService as service } from './service';

type Question = typeof feedbackQuestions.$inferInsert;

export async function getQuestions(page = 1, search = '') {
	return service.findAll({
		page,
		search: search.trim(),
		searchColumns: ['text'],
	});
}

export async function getQuestion(id: number) {
	return service.get(id);
}

export async function createQuestion(data: Question) {
	return service.create(data);
}

export async function updateQuestion(id: number, data: Question) {
	return service.update(id, data);
}

export async function deleteQuestion(id: number) {
	return service.delete(id);
}
