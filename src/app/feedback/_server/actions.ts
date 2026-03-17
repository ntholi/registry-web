'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
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

export const submitLecturerFeedback = createAction(
	async (
		passphraseId: string,
		assignedModuleId: number,
		responses: { questionId: string; rating: number; comment: string | null }[]
	) => {
		await feedbackService.submitLecturerFeedback(
			passphraseId,
			assignedModuleId,
			responses
		);
	}
);

export const skipLecturer = createAction(
	async (
		passphraseId: string,
		assignedModuleId: number,
		questionIds: string[]
	) => {
		await feedbackService.skipLecturer(
			passphraseId,
			assignedModuleId,
			questionIds
		);
	}
);

export const finalizeFeedback = createAction(async (passphraseId: string) => {
	await feedbackService.finalizeFeedback(passphraseId);
});
