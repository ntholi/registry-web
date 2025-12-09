export type QuestionType =
	| 'multichoice'
	| 'truefalse'
	| 'shortanswer'
	| 'essay'
	| 'numerical';

export type MultiChoiceAnswer = {
	text: string;
	fraction: number;
	feedback?: string;
};

export type ShortAnswer = {
	text: string;
	fraction?: number;
	feedback?: string;
};

export type NumericalAnswer = {
	answer: string;
	tolerance?: number;
	fraction?: number;
	feedback?: string;
};

export type MultiChoiceQuestion = {
	type: 'multichoice';
	name: string;
	questionText: string;
	defaultMark: number;
	single: boolean;
	shuffleAnswers?: boolean;
	answerNumbering?: 'abc' | 'ABC' | '123' | 'iii' | 'III' | 'none';
	answers: MultiChoiceAnswer[];
	generalFeedback?: string;
	correctFeedback?: string;
	incorrectFeedback?: string;
	partiallyCorrectFeedback?: string;
};

export type TrueFalseQuestion = {
	type: 'truefalse';
	name: string;
	questionText: string;
	defaultMark: number;
	correctAnswer: boolean;
	feedbackTrue?: string;
	feedbackFalse?: string;
	generalFeedback?: string;
};

export type ShortAnswerQuestion = {
	type: 'shortanswer';
	name: string;
	questionText: string;
	defaultMark: number;
	useCase: boolean;
	answers: ShortAnswer[];
	generalFeedback?: string;
};

export type EssayQuestion = {
	type: 'essay';
	name: string;
	questionText: string;
	defaultMark: number;
	responseFormat:
		| 'editor'
		| 'editorfilepicker'
		| 'plain'
		| 'monospaced'
		| 'noinline';
	responseRequired?: boolean;
	responseFieldLines: number;
	minWordLimit?: number;
	maxWordLimit?: number;
	attachments: number;
	attachmentsRequired?: number;
	graderInfo?: string;
	responseTemplate?: string;
	generalFeedback?: string;
};

export type NumericalQuestion = {
	type: 'numerical';
	name: string;
	questionText: string;
	defaultMark: number;
	answers: NumericalAnswer[];
	generalFeedback?: string;
};

export type Question =
	| MultiChoiceQuestion
	| TrueFalseQuestion
	| ShortAnswerQuestion
	| EssayQuestion
	| NumericalQuestion;

// Quiz settings types matching the Moodle API
export type QuizSettings = {
	timeOpen?: number; // Unix timestamp
	timeClose?: number; // Unix timestamp
	timelimit?: number; // Seconds
	overdueHandling?: 'autosubmit' | 'graceperiod' | 'autoabandon';
	gracePeriod?: number; // Seconds
	grade?: number; // Maximum grade
	gradeMethod?: 1 | 2 | 3 | 4; // 1=highest, 2=average, 3=first, 4=last
	attempts?: number; // 0 = unlimited
	questionsPerPage?: number; // 0 = all on one page
	navMethod?: 'free' | 'sequential';
	shuffleAnswers?: boolean;
	preferredBehaviour?:
		| 'deferredfeedback'
		| 'adaptivenopenalty'
		| 'adaptive'
		| 'interactive'
		| 'immediatefeedback'
		| 'immediatecbm';
	password?: string;
	visible?: boolean;
};

export type MoodleQuizSection = {
	id: number;
	firstslot: number;
	heading: string;
	shufflequestions: number;
};

export type MoodleQuizQuestion = {
	slotid: number;
	slot: number;
	page: number;
	maxmark: number;
	requireprevious: number;
	displaynumber: string;
	questionbankentryid: number;
	questionid: number;
	questionidnumber: string;
	questionname: string;
	qtype: string;
	questiontext: string;
	defaultmark: number;
	version: number;
	status: string;
};

export type MoodleQuiz = {
	id: number;
	coursemoduleid: number;
	courseid?: number;
	coursename?: string;
	course?: number;
	name: string;
	intro: string;
	introformat?: number;
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
	sections?: MoodleQuizSection[];
	questions?: MoodleQuizQuestion[];
	attemptcount?: number;
};

export type QuizFormValues = {
	assessmentNumber: string;
	assessmentType: string;
	weight: number;
	timelimit: number | null;
	attempts: number;
	questions: Question[];
};

export type CreateQuestionResponse = {
	questionid: number;
	questionbankentryid: number;
	name: string;
	success: boolean;
	message: string;
};

export type CreateQuizResponse = {
	id: number;
	coursemoduleid: number;
	name: string;
	success: boolean;
	message: string;
};

export type AddQuestionToQuizResponse = {
	success: boolean;
	message: string;
	slotid: number;
	slot: number;
};
