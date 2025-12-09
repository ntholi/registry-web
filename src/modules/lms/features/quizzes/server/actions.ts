'use server';

import { auth } from '@/core/auth';
import type { AssessmentNumber } from '@/core/database';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { createAssessment as createAcademicAssessment } from '@/modules/academic/features/assessments/server/actions';
import { getCurrentTerm } from '@/modules/registry/features/terms';
import type {
	EssayQuestion,
	MoodleQuiz,
	MultiChoiceQuestion,
	Question,
	ShortAnswerQuestion,
	TrueFalseQuestion,
} from '../types';

type CourseSection = {
	id: number;
	name: string;
	section: number;
	summaryformat: number;
	summary: string;
	modules: Array<{
		id: number;
		name: string;
		modname: string;
	}>;
};

async function getCourseSections(courseId: number): Promise<CourseSection[]> {
	const result = await moodleGet('core_course_get_contents', {
		courseid: courseId,
	});

	return result as CourseSection[];
}

async function getOrCreateTestsQuizzesSection(
	courseId: number
): Promise<number> {
	const sections = await getCourseSections(courseId);

	const quizSection = sections.find(
		(section) =>
			section.name.toLowerCase() === 'tests & quizzes' ||
			section.name.toLowerCase() === 'tests and quizzes'
	);

	if (quizSection) {
		return quizSection.section;
	}

	try {
		const result = await moodlePost('local_activity_utils_create_section', {
			courseid: courseId,
			name: 'Tests & Quizzes',
			summary: 'Course tests and quizzes',
		});

		if (result && result.sectionnum !== undefined) {
			return result.sectionnum;
		}

		const updatedSections = await getCourseSections(courseId);
		const newSection = updatedSections.find(
			(section) => section.name === 'Tests & Quizzes'
		);
		return newSection?.section || 0;
	} catch (error) {
		console.error('Failed to create Tests & Quizzes section:', error);
		throw new Error(
			'Unable to create Tests & Quizzes section. Please ensure the local_activity_utils plugin is installed.'
		);
	}
}

async function getOrCreateQuestionCategory(courseId: number): Promise<number> {
	const categoryName = `Quiz Questions - Course ${courseId}`;

	try {
		const result = await moodlePost(
			'local_activity_utils_create_question_category',
			{
				courseid: courseId,
				name: categoryName,
				info: 'Auto-created category for quiz questions',
			}
		);

		return result.categoryid;
	} catch (error: unknown) {
		const err = error as { errorcode?: string };
		if (err.errorcode === 'categoryexists') {
			const categories = await moodleGet(
				'local_activity_utils_get_question_categories',
				{
					courseid: courseId,
				}
			);
			const existingCategory = categories?.find(
				(cat: { name: string }) => cat.name === categoryName
			);
			if (existingCategory) {
				return existingCategory.id;
			}
		}
		throw error;
	}
}

async function createMultiChoiceQuestion(
	categoryId: number,
	question: MultiChoiceQuestion
): Promise<number> {
	const answers = question.answers.map((a) => ({
		text: a.text,
		fraction: a.fraction,
		feedback: a.feedback || '',
	}));

	const result = await moodlePost(
		'local_activity_utils_create_question_multichoice',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			single: question.single ? 1 : 0,
			answers: JSON.stringify(answers),
		}
	);

	return result.questionid;
}

async function createTrueFalseQuestion(
	categoryId: number,
	question: TrueFalseQuestion
): Promise<number> {
	const result = await moodlePost(
		'local_activity_utils_create_question_truefalse',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			correctanswer: question.correctAnswer ? 1 : 0,
		}
	);

	return result.questionid;
}

async function createShortAnswerQuestion(
	categoryId: number,
	question: ShortAnswerQuestion
): Promise<number> {
	const answers = question.answers.map((a) => ({
		text: a.text,
		fraction: a.fraction,
		feedback: a.feedback || '',
	}));

	const result = await moodlePost(
		'local_activity_utils_create_question_shortanswer',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			usecase: question.useCase ? 1 : 0,
			answers: JSON.stringify(answers),
		}
	);

	return result.questionid;
}

async function createEssayQuestion(
	categoryId: number,
	question: EssayQuestion
): Promise<number> {
	const result = await moodlePost(
		'local_activity_utils_create_question_essay',
		{
			categoryid: categoryId,
			name: question.name,
			questiontext: question.questionText,
			defaultmark: question.defaultMark,
			responseformat: question.responseFormat,
			responsefieldlines: question.responseFieldLines,
			attachments: question.attachments,
		}
	);

	return result.questionid;
}

async function createQuestionInMoodle(
	categoryId: number,
	question: Question
): Promise<number> {
	switch (question.type) {
		case 'multichoice':
			return createMultiChoiceQuestion(categoryId, question);
		case 'truefalse':
			return createTrueFalseQuestion(categoryId, question);
		case 'shortanswer':
			return createShortAnswerQuestion(categoryId, question);
		case 'essay':
			return createEssayQuestion(categoryId, question);
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
	timelimit: number | null;
	attempts: number;
	questions: Question[];
};

export async function createQuiz(input: CreateQuizInput) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const term = await getCurrentTerm();
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

	const sectionNumber = await getOrCreateTestsQuizzesSection(input.courseId);

	const quizParams: Record<string, string | number> = {
		courseid: input.courseId,
		name: input.name,
		section: sectionNumber,
		grademax: totalMarks,
		questionsperpage: 1,
	};

	if (input.timelimit && input.timelimit > 0) {
		quizParams.timelimit = input.timelimit * 60;
	}

	if (input.attempts > 0) {
		quizParams.attempts = input.attempts;
	}

	const quizResult = await moodlePost(
		'local_activity_utils_create_quiz',
		quizParams
	);

	const quizId = quizResult.quizid;
	const courseModuleId = quizResult.coursemoduleid;

	try {
		const categoryId = await getOrCreateQuestionCategory(input.courseId);

		for (let i = 0; i < input.questions.length; i++) {
			const question = input.questions[i];
			const questionId = await createQuestionInMoodle(categoryId, question);

			await moodlePost('local_activity_utils_add_question_to_quiz', {
				quizid: quizId,
				questionid: questionId,
				page: i + 1,
				maxmark: question.defaultMark,
			});
		}

		await createAcademicAssessment({
			moduleId: input.moduleId,
			assessmentNumber: input.assessmentNumber as AssessmentNumber,
			assessmentType: input.name,
			totalMarks: totalMarks,
			weight: input.weight,
			termId: term.id,
		});
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

	return result.quizzes as MoodleQuiz[];
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
