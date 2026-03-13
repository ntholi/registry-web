import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import {
	finalize,
	getExistingResponses,
	getLecturersForClass,
	getQuestionsByCategory,
	markSkipped,
	saveResponses,
	validatePassphrase,
} from './repository';

class FeedbackService {
	async validatePassphrase(passphrase: string) {
		return withPermission(async () => {
			const result = await validatePassphrase(passphrase);
			if (!result) {
				return { error: 'Invalid passphrase' as const };
			}

			return result;
		}, 'all');
	}

	async getFeedbackData(
		structureSemesterId: number,
		termId: number,
		passphraseId: string
	) {
		return withPermission(async () => {
			const [lecturers, questions, existingResponses] = await Promise.all([
				getLecturersForClass(structureSemesterId, termId),
				getQuestionsByCategory(),
				getExistingResponses(passphraseId),
			]);

			return { lecturers, questions, existingResponses };
		}, 'all');
	}

	async submitLecturerFeedback(
		passphraseId: string,
		assignedModuleId: number,
		responses: { questionId: string; rating: number; comment: string | null }[]
	) {
		return withPermission(async () => {
			await saveResponses(passphraseId, assignedModuleId, responses);
			return { success: true };
		}, 'all');
	}

	async skipLecturer(
		passphraseId: string,
		assignedModuleId: number,
		questionIds: string[]
	) {
		return withPermission(async () => {
			await markSkipped(passphraseId, assignedModuleId, questionIds);
			return { success: true };
		}, 'all');
	}

	async finalizeFeedback(passphraseId: string) {
		return withPermission(async () => {
			await finalize(passphraseId);
			return { success: true };
		}, 'all');
	}
}

export const feedbackService = serviceWrapper(
	FeedbackService,
	'FeedbackService'
);
