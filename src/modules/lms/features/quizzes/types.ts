export type QuestionType =
	| 'multichoice'
	| 'truefalse'
	| 'shortanswer'
	| 'essay';

export type MultiChoiceAnswer = {
	text: string;
	fraction: number;
	feedback?: string;
};

export type ShortAnswer = {
	text: string;
	fraction: number;
	feedback?: string;
};

export type MultiChoiceQuestion = {
	type: 'multichoice';
	name: string;
	questionText: string;
	defaultMark: number;
	single: boolean;
	answers: MultiChoiceAnswer[];
};

export type TrueFalseQuestion = {
	type: 'truefalse';
	name: string;
	questionText: string;
	defaultMark: number;
	correctAnswer: boolean;
};

export type ShortAnswerQuestion = {
	type: 'shortanswer';
	name: string;
	questionText: string;
	defaultMark: number;
	useCase: boolean;
	answers: ShortAnswer[];
};

export type EssayQuestion = {
	type: 'essay';
	name: string;
	questionText: string;
	defaultMark: number;
	responseFormat: 'editor' | 'plain' | 'monospaced';
	responseFieldLines: number;
	attachments: number;
};

export type Question =
	| MultiChoiceQuestion
	| TrueFalseQuestion
	| ShortAnswerQuestion
	| EssayQuestion;

export type CreateQuizParams = {
	courseid: number;
	name: string;
	intro?: string;
	section: number;
	grademax: number;
	gradepass?: number;
	timelimit?: number;
	attempts?: number;
	questionsperpage?: number;
};

export type MoodleQuiz = {
	id: number;
	coursemoduleid: number;
	course: number;
	name: string;
	intro: string;
	introformat: number;
	timeopen: number;
	timeclose: number;
	timelimit: number;
	preferredbehaviour: string;
	attempts: number;
	grademethod: number;
	decimalpoints: number;
	questiondecimalpoints: number;
	sumgrades: number;
	grade: number;
	questions?: MoodleQuizQuestion[];
};

export type MoodleQuizQuestion = {
	slotid: number;
	slot: number;
	page: number;
	requireprevious: boolean;
	questionid: number;
	name: string;
	qtype: string;
	maxmark: number;
};

export type QuizFormValues = {
	assessmentNumber: string;
	assessmentType: string;
	weight: number;
	timelimit: number | null;
	attempts: number;
	questions: Question[];
};
