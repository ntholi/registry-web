import type { Grade, ModuleType } from '@academic/_database';
import type { programLevelEnum } from '@academic/_database/schema/enums';
import type { taskPriority, taskStatus } from '@admin/_database';
import type {
	QuestionType as LmsQuestionType,
	QuestionState,
} from '@lms/quizzes';
import type {
	SemesterStatus,
	StudentModuleStatus,
	StudentProgramStatus,
} from '@registry/_database';
import type { gender, studentStatus } from '@registry/_database/schema/enums';
import type { classTypeEnum } from '@timetable/_database';

type Gender = (typeof gender.enumValues)[number];
type ProgramLevel = (typeof programLevelEnum.enumValues)[number];
type ClassTypeDb = (typeof classTypeEnum.enumValues)[number];
type TaskPriority = (typeof taskPriority.enumValues)[number];
type TaskStatus = (typeof taskStatus.enumValues)[number];
type StudentStatus = (typeof studentStatus.enumValues)[number];

export const semantic = {
	success: 'green',
	error: 'red',
	warning: 'yellow',
	info: 'blue',
	neutral: 'gray',
	accent: 'teal',
	highlight: 'violet',
	progress: 'cyan',
	caution: 'orange',
	dark: 'dark',
	dimmed: 'dimmed',
} as const;

export const booleanColors = {
	positive: { true: semantic.success, false: semantic.neutral },
	negative: { true: semantic.error, false: semantic.neutral },
	highlight: { true: semantic.info, false: semantic.dimmed },
} as const;

export type BooleanColorType = keyof typeof booleanColors;

export const statusColors = {
	approval: {
		approved: semantic.success,
		confirmed: semantic.success,
		rejected: semantic.error,
		pending: semantic.warning,
		applied: semantic.warning,
		partial: semantic.caution,
	},
	activity: {
		active: semantic.success,
		inactive: semantic.neutral,
		visible: semantic.success,
		hidden: semantic.neutral,
		blocked: semantic.error,
		unblocked: semantic.success,
	},
	enrollment: {
		enrolled: semantic.neutral,
		registered: semantic.success,
		graduated: semantic.info,
		suspended: semantic.error,
		terminated: semantic.error,
		droppedout: semantic.error,
		dnr: semantic.error,
		withdrawn: semantic.error,
		deceased: semantic.neutral,
	},
	academic: {
		proceed: semantic.success,
		completed: semantic.progress,
		repeat: semantic.highlight,
		deferred: semantic.warning,
		supplementary: semantic.warning,
		nomarks: semantic.warning,
		remaininsemester: semantic.error,
		exempted: semantic.info,
		changed: semantic.info,
	},
	availability: {
		open: semantic.success,
		closed: semantic.error,
		notyetopen: semantic.neutral,
		overdue: semantic.error,
		upcoming: semantic.accent,
	},
	assignment: {
		assigned: semantic.info,
		unassigned: semantic.neutral,
	},
	attendance: {
		present: semantic.success,
		absent: semantic.error,
		late: semantic.warning,
		excused: semantic.info,
		no_class: semantic.accent,
		not_marked: semantic.neutral,
	},
	dataOp: {
		deleted: semantic.error,
		delete: semantic.error,
		drop: semantic.error,
		outstanding: semantic.dark,
	},
	grade: {
		excellent: semantic.success,
		good: semantic.info,
		average: semantic.warning,
		poor: semantic.error,
		incomplete: semantic.caution,
	},
	action: {
		add: semantic.success,
		remove: semantic.error,
		update: semantic.info,
		create: semantic.success,
		delete: semantic.error,
	},
	alert: {
		info: semantic.info,
		warning: semantic.caution,
		error: semantic.error,
		success: semantic.success,
	},
	moduleType: {
		compulsory: semantic.info,
		elective: semantic.success,
		repeat: semantic.caution,
		resit: semantic.warning,
		exempted: semantic.accent,
	},
	quizState: {
		gradedright: semantic.success,
		gradedwrong: semantic.error,
		gradedpartial: semantic.warning,
		needsgrading: semantic.caution,
		gaveup: semantic.neutral,
		todo: semantic.neutral,
		complete: semantic.info,
	},
	questionType: {
		multichoice: 'blue',
		truefalse: 'green',
		shortanswer: 'orange',
		essay: 'violet',
		numerical: 'cyan',
		match: 'teal',
		description: 'gray',
	},
	classType: {
		lecture: 'blue.3',
		tutorial: 'green.3',
		lab: 'orange.3',
		workshop: 'purple.3',
		practical: 'red.3',
	},
	gender: {
		male: 'blue',
		female: 'pink',
	},
	programLevel: {
		certificate: 'teal',
		diploma: 'blue',
		degree: 'violet',
	},
	semesterStatus: {
		active: 'green',
		repeat: 'yellow',
		deferred: 'blue',
		droppedout: 'red',
		completed: 'teal',
	},
	priority: {
		low: semantic.neutral,
		medium: semantic.info,
		high: semantic.caution,
		urgent: semantic.error,
	},
	taskStatus: {
		todo: semantic.neutral,
		in_progress: semantic.info,
		inprogress: semantic.info,
		on_hold: semantic.warning,
		onhold: semantic.warning,
		completed: semantic.success,
		cancelled: semantic.error,
	},
	documentVerificationStatus: {
		pending: semantic.warning,
		verified: semantic.success,
		rejected: semantic.error,
	},
	applicationStatus: {
		draft: semantic.neutral,
		submitted: semantic.info,
		under_review: semantic.warning,
		underreview: semantic.warning,
		accepted_first_choice: semantic.success,
		acceptedfirstchoice: semantic.success,
		accepted_second_choice: semantic.success,
		acceptedsecondchoice: semantic.success,
		rejected: semantic.error,
		waitlisted: semantic.caution,
	},
	paymentStatus: {
		unpaid: semantic.error,
		paid: semantic.success,
	},
	bookCondition: {
		new: semantic.success,
		good: semantic.info,
		damaged: semantic.error,
	},
	bookCopyStatus: {
		available: semantic.success,
		onloan: semantic.warning,
		withdrawn: semantic.neutral,
	},
	loanStatus: {
		active: semantic.info,
		returned: semantic.success,
		overdue: semantic.error,
	},
} as const;

const allStatuses = {
	...statusColors.approval,
	...statusColors.activity,
	...statusColors.enrollment,
	...statusColors.academic,
	...statusColors.availability,
	...statusColors.assignment,
	...statusColors.attendance,
	...statusColors.dataOp,
} as const;

export type AllStatusType =
	| keyof typeof allStatuses
	| StudentStatus
	| StudentProgramStatus
	| SemesterStatus
	| StudentModuleStatus
	| ModuleType;
export type QuizStateType = keyof typeof statusColors.quizState | QuestionState;
export type QuestionType =
	| keyof typeof statusColors.questionType
	| LmsQuestionType;
export type ClassType = keyof typeof statusColors.classType | ClassTypeDb;
export type GenderType = keyof typeof statusColors.gender | Gender;
export type ProgramLevelType =
	| keyof typeof statusColors.programLevel
	| ProgramLevel;
export type ChartSemesterStatusType =
	| keyof typeof statusColors.semesterStatus
	| SemesterStatus;
export type TaskPriorityType =
	| keyof typeof statusColors.priority
	| TaskPriority;
export type TaskStatusType = keyof typeof statusColors.taskStatus | TaskStatus;
export type ModuleTypeColorKey =
	| keyof typeof statusColors.moduleType
	| StudentModuleStatus
	| ModuleType
	| `Repeat${number}`
	| `Resit${number}`;

function getColorFromMap<T extends Record<string, string>, V extends string>(
	value: V,
	colorMap: T,
	fallback: string = semantic.neutral
) {
	if (!value) return fallback;
	const normalized = value.toLowerCase().replace(/\s+/g, '');
	if (normalized in colorMap) {
		return colorMap[normalized as keyof T];
	}
	return fallback;
}

export function getBooleanColor(
	value: boolean,
	type: BooleanColorType = 'positive'
) {
	return value ? booleanColors[type].true : booleanColors[type].false;
}

export function getOptionalColor(condition: boolean) {
	return condition ? semantic.dimmed : undefined;
}

export function getThresholdColor(
	value: number | null | undefined,
	thresholds: { good: number; moderate?: number },
	colors: { good?: string; moderate?: string; bad?: string; none?: string } = {}
) {
	const {
		good = semantic.success,
		moderate = semantic.warning,
		bad = semantic.error,
		none = semantic.neutral,
	} = colors;

	if (value === null || value === undefined) return none;
	if (value >= thresholds.good) return good;
	if (thresholds.moderate !== undefined && value >= thresholds.moderate)
		return moderate;
	return bad;
}

export function getStatusColor(status: AllStatusType) {
	if (!status) return semantic.neutral;
	const normalized = status.toLowerCase().replace(/\s+/g, '');

	if (normalized in allStatuses) {
		return allStatuses[normalized as keyof typeof allStatuses];
	}

	if (normalized.includes('pending')) return statusColors.approval.pending;
	if (normalized.includes('reject')) return statusColors.approval.rejected;
	if (
		normalized.includes('pass') ||
		normalized.includes('success') ||
		normalized.includes('proceed')
	)
		return statusColors.activity.active;
	if (normalized.includes('fail') || normalized.includes('remain'))
		return statusColors.approval.rejected;
	if (normalized.includes('supplementary'))
		return statusColors.academic.supplementary;
	if (normalized.includes('repeat')) return statusColors.academic.repeat;

	return semantic.neutral;
}

export function getGradeColor(grade: Grade) {
	if (!grade) return semantic.neutral;
	const g = grade.toUpperCase();

	if (g === 'ANN') return semantic.error;
	if (['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'PX'].includes(g))
		return statusColors.grade.excellent;
	if (['PP', 'DEF', 'NM'].includes(g)) return statusColors.grade.incomplete;
	if (['F', 'FX', 'FIN', 'D', 'D+', 'D-', 'E', 'E+', 'E-'].includes(g))
		return statusColors.grade.poor;

	return semantic.neutral;
}

export function getModuleTypeColor(
	type: StudentModuleStatus | ModuleTypeColorKey
) {
	if (!type) return semantic.neutral;
	const normalized = type.toLowerCase();

	if (normalized in statusColors.moduleType) {
		return statusColors.moduleType[
			normalized as keyof typeof statusColors.moduleType
		];
	}
	if (normalized.startsWith('repeat')) return statusColors.moduleType.repeat;
	if (normalized.startsWith('resit')) return statusColors.moduleType.resit;
	if (normalized === 'drop' || normalized === 'delete') return semantic.error;

	return semantic.neutral;
}

export function getQuizStatusColor(isNotYetOpen: boolean, isClosed: boolean) {
	if (isNotYetOpen) {
		return {
			label: 'Not yet open',
			color: statusColors.availability.notyetopen,
		};
	}
	if (isClosed) {
		return { label: 'Closed', color: statusColors.availability.closed };
	}
	return { label: 'Open', color: statusColors.availability.open };
}

export function getAssignmentStatusColor(
	isOverdue: boolean,
	isUpcoming: boolean
) {
	if (isOverdue) {
		return { label: 'Overdue', color: statusColors.availability.overdue };
	}
	if (isUpcoming) {
		return { label: 'Upcoming', color: statusColors.availability.upcoming };
	}
	return { label: 'Active', color: statusColors.activity.active };
}

export function getActionColor(action: 'add' | 'remove' | 'update') {
	return statusColors.action[action];
}

export function getAuditActionColor(action: 'create' | 'update' | 'delete') {
	return statusColors.action[action];
}

export function getAlertColor(type: 'info' | 'warning' | 'error' | 'success') {
	return statusColors.alert[type];
}

export function getQuizStateColor(state: QuizStateType) {
	return getColorFromMap(state, statusColors.quizState);
}

export function getQuestionTypeColor(type: QuestionType) {
	return getColorFromMap(type, statusColors.questionType);
}

export function getClassTypeColor(type: ClassType) {
	return getColorFromMap(type, statusColors.classType, 'cyan.3');
}

export function getGenderColor(gender: GenderType) {
	return getColorFromMap(gender, statusColors.gender, 'gray');
}

export function getProgramLevelColor(level: ProgramLevelType) {
	return getColorFromMap(level, statusColors.programLevel, 'gray');
}

export function getChartSemesterStatusColor(status: ChartSemesterStatusType) {
	return getColorFromMap(status, statusColors.semesterStatus, 'gray');
}

export function getPostTypeColor(type: 'announcement' | 'discussion') {
	return statusColors.approval[
		type === 'announcement' ? 'confirmed' : 'pending'
	]
		? semantic.info
		: semantic.accent;
}

export function getTaskPriorityColor(priority: TaskPriorityType) {
	return getColorFromMap(priority, statusColors.priority);
}

export function getTaskStatusColor(status: TaskStatusType) {
	return getColorFromMap(status, statusColors.taskStatus);
}

export type LoanStatusType = 'Active' | 'Returned' | 'Overdue';

export function getLoanStatusColor(status: LoanStatusType) {
	return getColorFromMap(status, statusColors.loanStatus);
}

export function getPercentageColor(percentage: number | null) {
	return getThresholdColor(percentage, { good: 75, moderate: 50 });
}

export function getPointsColor(points: number | null) {
	return getThresholdColor(
		points,
		{ good: 4.0, moderate: 3.0 },
		{ moderate: semantic.info, bad: semantic.caution }
	);
}

export function getMarksPercentageColor(
	marks: number | null | undefined,
	maxMarks: number
) {
	if (marks === null || marks === undefined) return semantic.neutral;
	return getThresholdColor((marks / maxMarks) * 100, { good: 50 });
}

export function getVersionCountColor(count: number) {
	if (count === 1) return semantic.success;
	if (count <= 3) return semantic.warning;
	return semantic.error;
}

export function getModuleStatusTextColor(status: StudentModuleStatus) {
	const normalized = status.toLowerCase();
	if (normalized.startsWith('repeat')) return semantic.error;
	return undefined;
}

export function getSemesterResultColor(
	status: SemesterStatus | ChartSemesterStatusType
) {
	const normalized = status.toLowerCase();
	if (normalized === 'active') return semantic.success;
	if (normalized === 'repeat') return semantic.caution;
	return getStatusColor(status as AllStatusType);
}

export type DocumentVerificationStatusType =
	keyof typeof statusColors.documentVerificationStatus;

export function getDocumentVerificationStatusColor(
	status: DocumentVerificationStatusType
) {
	return getColorFromMap(status, statusColors.documentVerificationStatus);
}

export type ApplicationStatusType = keyof typeof statusColors.applicationStatus;

export function getApplicationStatusColor(status: ApplicationStatusType) {
	return getColorFromMap(status, statusColors.applicationStatus);
}

export type PaymentStatusType = keyof typeof statusColors.paymentStatus;

export function getPaymentStatusColor(status: PaymentStatusType) {
	return getColorFromMap(status, statusColors.paymentStatus);
}

export type BookConditionType = keyof typeof statusColors.bookCondition;

export function getConditionColor(condition: BookConditionType | string) {
	return getColorFromMap(condition, statusColors.bookCondition);
}

export type BookCopyStatusType = keyof typeof statusColors.bookCopyStatus;

export function getBookCopyStatusColor(status: BookCopyStatusType | string) {
	return getColorFromMap(status, statusColors.bookCopyStatus);
}
