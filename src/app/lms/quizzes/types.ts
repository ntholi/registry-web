export type QuestionType =
	| 'multichoice'
	| 'truefalse'
	| 'shortanswer'
	| 'essay'
	| 'numerical'
	| 'match'
	| 'cloze'
	| 'description'
	| 'calculated'
	| 'calculatedmulti'
	| 'calculatedsimple'
	| 'ddimageortext'
	| 'ddmarker'
	| 'ddwtos'
	| 'gapselect'
	| 'missingtype'
	| 'random'
	| 'randomsamatch';

export type TextFormat = 0 | 1 | 2 | 4;

export type AnswerNumbering = 'abc' | 'ABC' | '123' | 'iii' | 'III' | 'none';

export type GradeMethod = 1 | 2 | 3 | 4;

export type QuizOverdueHandling = 'autosubmit' | 'graceperiod' | 'autoabandon';

export type QuizNavMethod = 'free' | 'sequential';

export type QuizPreferredBehaviour =
	| 'deferredfeedback'
	| 'adaptivenopenalty'
	| 'adaptive'
	| 'interactive'
	| 'immediatefeedback'
	| 'immediatecbm'
	| 'deferredcbm';

export type EssayResponseFormat =
	| 'editor'
	| 'editorfilepicker'
	| 'plain'
	| 'monospaced'
	| 'noinline';

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
	answerNumbering?: AnswerNumbering;
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
	responseFormat: EssayResponseFormat;
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

export type QuizSettings = {
	timeOpen?: number;
	timeClose?: number;
	timelimit?: number;
	overdueHandling?: QuizOverdueHandling;
	gracePeriod?: number;
	grade?: number;
	gradeMethod?: GradeMethod;
	attempts?: number;
	questionsPerPage?: number;
	navMethod?: QuizNavMethod;
	shuffleAnswers?: boolean;
	preferredBehaviour?: QuizPreferredBehaviour;
	password?: string;
	visible?: boolean;
};

export type MoodleQuizSection = {
	id: number;
	firstslot: number;
	heading: string;
	shufflequestions: number;
};

export type MoodleQuestionAnswer = {
	id: number;
	answer: string;
	answerformat: TextFormat;
	fraction: number;
	feedback?: string;
};

export type MoodleQuestionStatus = 'ready' | 'draft' | 'hidden';

export type MoodleQuizQuestion = {
	slotid: number;
	slot: number;
	page: number;
	maxmark: number;
	requireprevious: 0 | 1;
	displaynumber: string;
	questionbankentryid: number;
	questionid: number;
	questionidnumber: string;
	questionname: string;
	qtype: QuestionType;
	questiontext: string;
	defaultmark: number;
	version: number;
	status: MoodleQuestionStatus;
	answers?: MoodleQuestionAnswer[];
	correctanswer?: 0 | 1;
};

export type MoodleQuiz = {
	id: number;
	coursemoduleid: number;
	courseid?: number;
	coursename?: string;
	course?: number;
	name: string;
	intro: string;
	introformat?: TextFormat;
	timeopen: number;
	timeclose: number;
	timelimit: number;
	preferredbehaviour: QuizPreferredBehaviour;
	attempts: number;
	grademethod: GradeMethod;
	decimalpoints: number;
	questiondecimalpoints: number;
	sumgrades: number;
	grade: number;
	visible?: number;
	sections?: MoodleQuizSection[];
	questions?: MoodleQuizQuestion[];
	attemptcount?: number;
};

export type QuizFormValues = {
	assessmentNumber: string;
	assessmentType: string;
	weight: number;
	startDateTime: Date | null;
	endDateTime: Date | null;
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

export type QuizAttemptState =
	| 'inprogress'
	| 'overdue'
	| 'finished'
	| 'abandoned';

export type QuestionState =
	| 'gradedright'
	| 'gradedwrong'
	| 'gradedpartial'
	| 'needsgrading'
	| 'gaveup'
	| 'todo'
	| 'complete'
	| 'notanswered'
	| 'invalid'
	| 'mangrright'
	| 'mangrwrong'
	| 'mangrpartial';

export type QuizAttemptUser = {
	id: number;
	fullname: string;
	profileimageurl: string;
};

export type QuizAttempt = {
	id: number;
	userid: number;
	attempt: number;
	state: QuizAttemptState;
	timestart: number;
	timefinish: number | null;
	timemodified: number;
	sumgrades: number | null;
	user: QuizAttemptUser;
};

export type QuizAttemptQuestion = {
	slot: number;
	type: QuestionType;
	name: string;
	questiontext: string;
	maxmark: number;
	mark: number | null;
	response: string | null;
	rightanswer: string | null;
	state: QuestionState;
	feedback: string | null;
	sequencenumber?: number;
};

export type QuizAttemptDetails = {
	id: number;
	userid: number;
	state: QuizAttemptState;
	timestart: number;
	timefinish: number | null;
	sumgrades: number | null;
	grade: number | null;
	questions: QuizAttemptQuestion[];
};

export type DBStudentInfo = {
	stdNo: number;
	name: string;
};

export type QuizSubmissionUser = {
	id: number;
	fullname: string;
	profileimageurl: string;
	attempts: QuizAttempt[];
	bestAttempt: QuizAttempt | null;
	dbStudent: DBStudentInfo | null;
};
