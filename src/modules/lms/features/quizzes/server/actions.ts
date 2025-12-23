'use server';

import { createAssessment as createAcademicAssessment } from '@/app/academic/assessments/_server/actions';
import { auth } from '@/core/auth';
import type { AssessmentNumber } from '@/core/database';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { studentRepository } from '@/modules/lms/features/students/server/repository';
import { getOrReuseSection } from '@/modules/lms/shared/utils';
import { getActiveTerm } from '@/modules/registry/features/dates/terms';
import type {
	AddQuestionToQuizResponse,
	CreateQuestionResponse,
	CreateQuizResponse,
	EssayQuestion,
	MoodleQuiz,
	MultiChoiceQuestion,
	NumericalQuestion,
	Question,
	QuizAttempt,
	QuizAttemptDetails,
	QuizSubmissionUser,
	ShortAnswerQuestion,
	TrueFalseQuestion,
} from '../types';

function isTestsQuizzesSection(sectionName: string): boolean {
	const normalized = sectionName.trim().toLowerCase().replace(/&amp;/g, '&');
	return normalized === 'tests & quizzes' || normalized === 'tests and quizzes';
}

async function getOrCreateQuestionCategory(courseId: number): Promise<number> {
	const categoryName = `Quiz Questions - Course ${courseId}`;

	const result = await moodlePost(
		'local_activity_utils_get_or_create_question_category',
		{
			courseid: courseId,
			name: categoryName,
			info: 'Auto-created category for quiz questions',
		}
	);

	return result.id;
}

async function createMultiChoiceQuestion(
	categoryId: number,
	question: MultiChoiceQuestion
): Promise<CreateQuestionResponse> {
	const answers = question.answers.map((a) => ({
		text: a.text,
		fraction: a.fraction,
		feedback: a.feedback || '',
	}));

	const result = await moodlePost(
		'local_activity_utils_create_multichoice_question',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			single: question.single ? 1 : 0,
			shuffleanswers: question.shuffleAnswers !== false ? 1 : 0,
			answernumbering: question.answerNumbering || 'abc',
			correctfeedback: question.correctFeedback || '',
			partiallycorrectfeedback: question.partiallyCorrectFeedback || '',
			incorrectfeedback: question.incorrectFeedback || '',
			generalfeedback: question.generalFeedback || '',
			answers: JSON.stringify(answers),
		}
	);

	return result as CreateQuestionResponse;
}

async function createTrueFalseQuestion(
	categoryId: number,
	question: TrueFalseQuestion
): Promise<CreateQuestionResponse> {
	const result = await moodlePost(
		'local_activity_utils_create_truefalse_question',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			correctanswer: question.correctAnswer ? 1 : 0,
			feedbacktrue: question.feedbackTrue || '',
			feedbackfalse: question.feedbackFalse || '',
			generalfeedback: question.generalFeedback || '',
		}
	);

	return result as CreateQuestionResponse;
}

async function createShortAnswerQuestion(
	categoryId: number,
	question: ShortAnswerQuestion
): Promise<CreateQuestionResponse> {
	const answers = question.answers.map((a) => ({
		text: a.text,
		fraction: a.fraction ?? 1.0,
		feedback: a.feedback || '',
	}));

	const result = await moodlePost(
		'local_activity_utils_create_shortanswer_question',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			usecase: question.useCase ? 1 : 0,
			generalfeedback: question.generalFeedback || '',
			answers: JSON.stringify(answers),
		}
	);

	return result as CreateQuestionResponse;
}

async function createEssayQuestion(
	categoryId: number,
	question: EssayQuestion
): Promise<CreateQuestionResponse> {
	const result = await moodlePost(
		'local_activity_utils_create_essay_question',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			responseformat: question.responseFormat,
			responserequired: question.responseRequired !== false ? 1 : 0,
			responsefieldlines: question.responseFieldLines,
			minwordlimit: question.minWordLimit || 0,
			maxwordlimit: question.maxWordLimit || 0,
			attachments: question.attachments,
			attachmentsrequired: question.attachmentsRequired || 0,
			graderinfo: question.graderInfo || '',
			responsetemplate: question.responseTemplate || '',
			generalfeedback: question.generalFeedback || '',
		}
	);

	return result as CreateQuestionResponse;
}

async function createNumericalQuestion(
	categoryId: number,
	question: NumericalQuestion
): Promise<CreateQuestionResponse> {
	const answers = question.answers.map((a) => ({
		answer: a.answer,
		tolerance: a.tolerance ?? 0,
		fraction: a.fraction ?? 1.0,
		feedback: a.feedback || '',
	}));

	const result = await moodlePost(
		'local_activity_utils_create_numerical_question',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			generalfeedback: question.generalFeedback || '',
			answers: JSON.stringify(answers),
		}
	);

	return result as CreateQuestionResponse;
}

async function createQuestionInMoodle(
	categoryId: number,
	question: Question
): Promise<CreateQuestionResponse> {
	switch (question.type) {
		case 'multichoice':
			return createMultiChoiceQuestion(categoryId, question);
		case 'truefalse':
			return createTrueFalseQuestion(categoryId, question);
		case 'shortanswer':
			return createShortAnswerQuestion(categoryId, question);
		case 'essay':
			return createEssayQuestion(categoryId, question);
		case 'numerical':
			return createNumericalQuestion(categoryId, question);
		default:
			throw new Error(`Unknown question type: ${(question as Question).type}`);
	}
}

type CreateQuizInput = {
	courseId: number;
	moduleId: number;
	name: string;
	assessmentNumber: string;
	weight: number;
	startDateTime: Date | null;
	endDateTime: Date | null;
	attempts: number;
	questions: Question[];
};

export async function createQuiz(input: CreateQuizInput) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const term = await getActiveTerm();
	if (!term) {
		throw new Error('No active term found');
	}

	if (!input.name?.trim()) {
		throw new Error('Quiz name is required');
	}

	if (!input.assessmentNumber?.trim()) {
		throw new Error('Assessment number is required');
	}

	if (input.questions.length === 0) {
		throw new Error('At least one question is required');
	}

	const totalMarks = input.questions.reduce((sum, q) => sum + q.defaultMark, 0);

	const sectionNumber = await getOrReuseSection({
		courseId: input.courseId,
		sectionName: 'Tests & Quizzes',
		summary: 'Course tests and quizzes',
		matchFn: isTestsQuizzesSection,
	});

	const quizParams: Record<string, string | number | boolean> = {
		courseid: input.courseId,
		name: input.name,
		section: sectionNumber,
		grade: totalMarks,
		questionsperpage: 1,
		preferredbehaviour: 'deferredfeedback',
		navmethod: 'free',
		shuffleanswers: 1,
		visible: 1,
	};

	const startDate = input.startDateTime ? new Date(input.startDateTime) : null;
	const endDate = input.endDateTime ? new Date(input.endDateTime) : null;

	if (startDate) {
		quizParams.timeopen = Math.floor(startDate.getTime() / 1000);
	}

	if (endDate) {
		quizParams.timeclose = Math.floor(endDate.getTime() / 1000);
	}

	if (startDate && endDate) {
		const timeLimitSeconds = Math.floor(
			(endDate.getTime() - startDate.getTime()) / 1000
		);
		if (timeLimitSeconds > 0) {
			quizParams.timelimit = timeLimitSeconds;
		}
	}

	if (input.attempts && input.attempts > 0) {
		quizParams.attempts = input.attempts;
	} else {
		quizParams.attempts = 0;
	}

	const quizResult = (await moodlePost(
		'local_activity_utils_create_quiz',
		quizParams
	)) as CreateQuizResponse;

	const quizId = quizResult.id;
	const courseModuleId = quizResult.coursemoduleid;

	if (!quizId) {
		throw new Error('Failed to create quiz: No quiz ID returned');
	}

	try {
		const categoryId = await getOrCreateQuestionCategory(input.courseId);

		for (let i = 0; i < input.questions.length; i++) {
			const question = input.questions[i];
			const questionResult = await createQuestionInMoodle(categoryId, question);

			if (!questionResult.questionbankentryid) {
				throw new Error(`Failed to create question: ${question.name}`);
			}

			const addResult = (await moodlePost(
				'local_activity_utils_add_question_to_quiz',
				{
					quizid: quizId,
					questionbankentryid: questionResult.questionbankentryid,
					page: i + 1,
					maxmark: question.defaultMark,
				}
			)) as AddQuestionToQuizResponse;

			if (!addResult.success) {
				throw new Error(`Failed to add question to quiz: ${addResult.message}`);
			}
		}

		await createAcademicAssessment(
			{
				moduleId: input.moduleId,
				assessmentNumber: input.assessmentNumber as AssessmentNumber,
				assessmentType: input.name,
				totalMarks: totalMarks,
				weight: input.weight,
				termId: term.id,
			},
			{
				lmsId: quizId,
				activityType: 'quiz',
			}
		);
	} catch (error) {
		await moodlePost('local_activity_utils_delete_quiz', {
			cmid: courseModuleId,
		});
		throw error;
	}

	return { quizId, courseModuleId, totalMarks };
}

export async function getCourseQuizzes(
	courseId: number
): Promise<MoodleQuiz[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('mod_quiz_get_quizzes_by_courses', {
		'courseids[0]': courseId,
	});

	if (!result || !result.quizzes) {
		return [];
	}

	return (
		result.quizzes as Array<
			MoodleQuiz & { cmid?: number; coursemodule?: number }
		>
	).map((quiz) => ({
		...quiz,
		coursemoduleid: quiz.coursemoduleid ?? quiz.coursemodule ?? quiz.cmid ?? 0,
	}));
}

export async function getQuiz(quizId: number): Promise<MoodleQuiz | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	try {
		const result = await moodleGet('local_activity_utils_get_quiz', {
			quizid: quizId,
		});

		return result as MoodleQuiz;
	} catch {
		return null;
	}
}

export async function deleteQuiz(cmid: number): Promise<void> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	await moodlePost('local_activity_utils_delete_quiz', {
		cmid,
	});
}

export async function getQuestionCategories(courseId: number) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet(
		'local_activity_utils_list_question_categories',
		{
			courseid: courseId,
		}
	);

	return result;
}

export async function getQuestionsInCategory(
	categoryId: number,
	options?: {
		includeSubcategories?: boolean;
		qtype?: string;
		limit?: number;
		offset?: number;
	}
) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('local_activity_utils_get_questions', {
		categoryid: categoryId,
		includesubcategories: options?.includeSubcategories ? 1 : 0,
		qtype: options?.qtype || '',
		limit: options?.limit || 0,
		offset: options?.offset || 0,
	});

	return result;
}

export async function removeQuestionFromQuiz(
	quizId: number,
	slot: number
): Promise<void> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	await moodlePost('local_activity_utils_remove_question_from_quiz', {
		quizid: quizId,
		slot,
	});
}

export async function reorderQuizQuestions(
	quizId: number,
	slots: Array<{ slotid: number; newslot: number; page?: number }>
): Promise<void> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	await moodlePost('local_activity_utils_reorder_quiz_questions', {
		quizid: quizId,
		slots: JSON.stringify(slots),
	});
}

export async function updateQuiz(
	quizId: number,
	params: {
		name?: string;
		intro?: string;
		timeopen?: number;
		timeclose?: number;
		timelimit?: number;
		attempts?: number;
		grade?: number;
		visible?: boolean;
	}
): Promise<void> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const updateParams: Record<string, string | number | boolean | undefined> = {
		quizid: quizId,
	};

	if (params.name !== undefined) updateParams.name = params.name;
	if (params.intro !== undefined) updateParams.intro = params.intro;
	if (params.timeopen !== undefined) updateParams.timeopen = params.timeopen;
	if (params.timeclose !== undefined) updateParams.timeclose = params.timeclose;
	if (params.timelimit !== undefined) updateParams.timelimit = params.timelimit;
	if (params.attempts !== undefined) updateParams.attempts = params.attempts;
	if (params.grade !== undefined) updateParams.grade = params.grade;
	if (params.visible !== undefined)
		updateParams.visible = params.visible ? 1 : 0;

	await moodlePost('local_activity_utils_update_quiz', updateParams);
}

export async function addExistingQuestionToQuiz(
	quizId: number,
	questionBankEntryId: number,
	options?: {
		page?: number;
		maxMark?: number;
		requirePrevious?: boolean;
	}
): Promise<AddQuestionToQuizResponse> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodlePost('local_activity_utils_add_question_to_quiz', {
		quizid: quizId,
		questionbankentryid: questionBankEntryId,
		page: options?.page || 0,
		maxmark: options?.maxMark,
		requireprevious: options?.requirePrevious ? 1 : 0,
	});

	return result as AddQuestionToQuizResponse;
}

export async function deleteQuestion(
	questionBankEntryId: number
): Promise<void> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	await moodlePost('local_activity_utils_delete_question', {
		questionbankentryid: questionBankEntryId,
	});
}

async function enrichUsersWithDBStudentInfo(
	users: Array<{
		id: number;
		fullname: string;
		profileimageurl: string;
	}>,
	attemptsMap: Map<number, QuizAttempt[]>
): Promise<Map<number, { stdNo: number; name: string }>> {
	const usersWithAttempts = users
		.filter((user) => {
			const attempts = attemptsMap.get(user.id);
			return attempts && attempts.length > 0;
		})
		.map((user) => user.id);

	if (usersWithAttempts.length === 0) {
		return new Map();
	}

	const dbStudents =
		await studentRepository.findStudentsByLmsUserIdsForSubmissions(
			usersWithAttempts
		);

	return new Map(
		dbStudents.map((s) => [s.lmsUserId!, { stdNo: s.stdNo, name: s.name }])
	);
}

export async function getQuizSubmissions(
	quizId: number,
	courseId: number
): Promise<QuizSubmissionUser[]> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const [attemptsResult, enrolledUsersResult] = await Promise.all([
		moodleGet('local_activity_utils_get_quiz_attempts', {
			quizid: quizId,
		}),
		moodleGet(
			'core_enrol_get_enrolled_users',
			{
				courseid: courseId,
			},
			process.env.MOODLE_TOKEN
		),
	]);

	const enrolledUsers = (
		enrolledUsersResult as Array<{
			id: number;
			fullname: string;
			profileimageurl: string;
			roles: Array<{ shortname: string }>;
		}>
	).filter((user) => user.roles.some((role) => role.shortname === 'student'));

	const attempts: QuizAttempt[] = attemptsResult?.attempts || [];

	const attemptsMap = new Map<number, QuizAttempt[]>();
	for (const attempt of attempts) {
		const userAttempts = attemptsMap.get(attempt.userid) || [];
		userAttempts.push(attempt);
		attemptsMap.set(attempt.userid, userAttempts);
	}

	const dbStudentMap = await enrichUsersWithDBStudentInfo(
		enrolledUsers,
		attemptsMap
	);

	return enrolledUsers.map((user) => {
		const userAttempts = attemptsMap.get(user.id) || [];
		const finishedAttempts = userAttempts.filter(
			(a) => a.state === 'finished' && a.sumgrades !== null
		);
		const bestAttempt =
			finishedAttempts.length > 0
				? finishedAttempts.reduce((best, current) =>
						(current.sumgrades ?? 0) > (best.sumgrades ?? 0) ? current : best
					)
				: null;

		return {
			id: user.id,
			fullname: user.fullname,
			profileimageurl: user.profileimageurl,
			attempts: userAttempts,
			bestAttempt,
			dbStudent: dbStudentMap.get(user.id) || null,
		};
	});
}

export async function getQuizAttemptDetails(
	attemptId: number
): Promise<QuizAttemptDetails | null> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	try {
		const result = await moodleGet(
			'local_activity_utils_get_quiz_attempt_details',
			{
				attemptid: attemptId,
			}
		);

		if (!result?.success) {
			return null;
		}

		return result.attempt as QuizAttemptDetails;
	} catch {
		return null;
	}
}

export async function gradeEssayQuestion(
	attemptId: number,
	slot: number,
	mark: number,
	comment?: string
): Promise<{ success: boolean; message: string }> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const params: Record<string, number | string> = {
		attemptid: attemptId,
		slot,
		mark,
	};

	if (comment) {
		params.comment = comment;
	}

	const result = await moodlePost(
		'local_activity_utils_grade_essay_question',
		params
	);

	return {
		success: result?.success ?? false,
		message: result?.message ?? 'Unknown error',
	};
}

export async function addQuizAttemptFeedback(
	attemptId: number,
	feedback: string
): Promise<{ success: boolean; message: string }> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodlePost('local_activity_utils_add_attempt_feedback', {
		attemptid: attemptId,
		feedback,
	});

	return {
		success: result?.success ?? false,
		message: result?.message ?? 'Unknown error',
	};
}

export async function getQuizAttemptFeedback(
	attemptId: number
): Promise<string | null> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	try {
		const result = await moodleGet(
			'local_activity_utils_get_attempt_feedback',
			{
				attemptid: attemptId,
			}
		);

		return result?.feedback ?? null;
	} catch {
		return null;
	}
}
