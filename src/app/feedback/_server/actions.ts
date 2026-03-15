'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import { feedbackService } from './service';

export const validateFeedbackPassphrase = createAction(
	async (passphrase: string) => {
		return feedbackService.validatePassphrase(passphrase);
	}
);

export const getFeedbackDataForPassphrase = createAction(
	async (structureSemesterId: number, termId: number, passphraseId: string) => {
		return feedbackService.getFeedbackData(
			structureSemesterId,
			termId,
			passphraseId
		);
	}
);

export const submitLecturerFeedback = createAction(
	async (
		passphraseId: string,
		assignedModuleId: number,
		responses: { questionId: string; rating: number; comment: string | null }[]
	) => {
		return feedbackService.submitLecturerFeedback(
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
		return feedbackService.skipLecturer(
			passphraseId,
			assignedModuleId,
			questionIds
		);
	}
);

export const finalizeFeedback = createAction(async (passphraseId: string) => {
	return feedbackService.finalizeFeedback(passphraseId);
});
