'use server';

import { feedbackService } from './service';

export async function validateFeedbackPassphrase(passphrase: string) {
	return feedbackService.validatePassphrase(passphrase);
}

export async function getFeedbackDataForPassphrase(
	structureSemesterId: number,
	termId: number,
	passphraseId: string
) {
	return feedbackService.getFeedbackData(
		structureSemesterId,
		termId,
		passphraseId
	);
}

export async function submitLecturerFeedback(
	passphraseId: string,
	assignedModuleId: number,
	responses: { questionId: string; rating: number; comment: string | null }[]
) {
	return feedbackService.submitLecturerFeedback(
		passphraseId,
		assignedModuleId,
		responses
	);
}

export async function skipLecturer(
	passphraseId: string,
	assignedModuleId: number,
	questionIds: string[]
) {
	return feedbackService.skipLecturer(
		passphraseId,
		assignedModuleId,
		questionIds
	);
}

export async function finalizeFeedback(passphraseId: string) {
	return feedbackService.finalizeFeedback(passphraseId);
}
