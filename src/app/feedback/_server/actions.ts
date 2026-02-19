'use server';

import withAuth from '@/core/platform/withAuth';
import {
	finalize,
	getExistingResponses,
	getLecturersForClass,
	getQuestionsByCategory,
	markSkipped,
	validatePassphrase as repoValidatePassphrase,
	saveResponses,
} from './repository';

export async function validateFeedbackPassphrase(passphrase: string) {
	return withAuth(async () => {
		const result = await repoValidatePassphrase(passphrase);
		if (!result) return { error: 'Invalid passphrase' as const };
		return result;
	}, ['all']);
}

export async function getFeedbackDataForPassphrase(
	structureSemesterId: number,
	termId: number,
	passphraseId: string
) {
	return withAuth(async () => {
		const [lecturers, questions, existingResponses] = await Promise.all([
			getLecturersForClass(structureSemesterId, termId),
			getQuestionsByCategory(),
			getExistingResponses(passphraseId),
		]);
		return { lecturers, questions, existingResponses };
	}, ['all']);
}

export async function submitLecturerFeedback(
	passphraseId: string,
	assignedModuleId: number,
	responses: { questionId: string; rating: number; comment: string | null }[]
) {
	return withAuth(async () => {
		await saveResponses(passphraseId, assignedModuleId, responses);
		return { success: true };
	}, ['all']);
}

export async function skipLecturer(
	passphraseId: string,
	assignedModuleId: number,
	questionIds: string[]
) {
	return withAuth(async () => {
		await markSkipped(passphraseId, assignedModuleId, questionIds);
		return { success: true };
	}, ['all']);
}

export async function finalizeFeedback(passphraseId: string) {
	return withAuth(async () => {
		await finalize(passphraseId);
		return { success: true };
	}, ['all']);
}
