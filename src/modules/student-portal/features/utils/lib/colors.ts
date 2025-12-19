export const statusColors = {
	status: {
		active: 'green',
		approved: 'green',
		registered: 'blue',
		rejected: 'red',
		partial: 'orange',
		pending: 'yellow',
		enrolled: 'gray',
		outstanding: 'dark',
		deleted: 'red',
		inactive: 'gray',
		dnr: 'red',
		droppedout: 'red',
		deferred: 'yellow',
		exempted: 'blue',
		confirmed: 'green',
		repeat: 'violet',
		supplementary: 'yellow',
		drop: 'red',
		delete: 'red',
		open: 'green',
		closed: 'red',
		notyetopen: 'gray',
		proceed: 'green',
		remaininsemester: 'red',
		nomarks: 'yellow',
		blocked: 'red',
		unblocked: 'green',
		hidden: 'gray',
		visible: 'green',
		assigned: 'blue',
		unassigned: 'gray',
		overdue: 'red',
		upcoming: 'teal',
		graduated: 'blue',
		suspended: 'red',
		terminated: 'red',
		withdrawn: 'gray',
		deceased: 'gray',
		applied: 'yellow',
		changed: 'blue',
		completed: 'cyan',
	},
	grade: {
		excellent: 'green',
		good: 'blue',
		average: 'yellow',
		poor: 'red',
		incomplete: 'orange',
	},
	action: {
		add: 'green',
		remove: 'red',
		update: 'blue',
	},
	alert: {
		info: 'blue',
		warning: 'orange',
		error: 'red',
		success: 'green',
	},
	theme: {
		primary: 'gray',
		secondary: 'orange',
		accent: 'violet',
	},
	moduleType: {
		compulsory: 'blue',
		elective: 'green',
		repeat: 'orange',
		resit: 'yellow',
		exempted: 'teal',
	},
	quizState: {
		gradedright: 'green',
		gradedwrong: 'red',
		gradedpartial: 'yellow',
		needsgrading: 'orange',
		gaveup: 'gray',
		todo: 'gray',
		complete: 'blue',
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
	programStatus: {
		active: 'green',
		changed: 'blue',
		completed: 'cyan',
		deleted: 'red',
		inactive: 'gray',
	},
	gender: {
		male: 'blue.6',
		female: 'pink.6',
	},
	programLevel: {
		certificate: 'teal.6',
		diploma: 'blue.6',
		degree: 'violet.6',
	},
	semesterStatus: {
		active: 'green.6',
		repeat: 'yellow.6',
		deferred: 'blue.6',
		droppedout: 'red.6',
		completed: 'teal.6',
	},
	postType: {
		announcement: 'blue',
		discussion: 'teal',
	},
	boolean: {
		true: 'green',
		false: 'red',
	},
	notification: {
		success: 'green',
		error: 'red',
		warning: 'orange',
		info: 'blue',
	},
	requestStatus: {
		registered: 'green',
		rejected: 'red',
		pending: 'gray',
	},
	taskPriority: {
		low: 'gray',
		medium: 'blue',
		high: 'orange',
		urgent: 'red',
	},
	taskStatus: {
		todo: 'gray',
		in_progress: 'blue',
		inprogress: 'blue',
		on_hold: 'yellow',
		onhold: 'yellow',
		completed: 'green',
		cancelled: 'red',
	},
	versionCount: {
		first: 'green',
		few: 'yellow',
		many: 'red',
	},
} as const;

export function getStatusColor(status: string) {
	if (!status) return 'gray';
	const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');

	if (normalizedStatus in statusColors.status) {
		return statusColors.status[
			normalizedStatus as keyof typeof statusColors.status
		];
	}

	if (normalizedStatus.includes('pending')) return statusColors.status.pending;
	if (normalizedStatus.includes('reject')) return statusColors.status.rejected;
	if (
		normalizedStatus.includes('pass') ||
		normalizedStatus.includes('success') ||
		normalizedStatus.includes('proceed')
	)
		return statusColors.status.active;
	if (normalizedStatus.includes('fail') || normalizedStatus.includes('remain'))
		return statusColors.status.rejected;
	if (normalizedStatus.includes('supplementary'))
		return statusColors.status.supplementary;
	if (normalizedStatus.includes('repeat')) return statusColors.status.repeat;

	return 'gray';
}

export function getGradeColor(grade: string) {
	if (!grade) return 'gray';
	const g = grade.toUpperCase();

	if (g === 'ANN') return 'red';
	if (['A+', 'A', 'A-'].includes(g)) return statusColors.grade.excellent;
	if (['B+', 'B', 'B-'].includes(g)) return statusColors.grade.good;
	if (['C+', 'C', 'C-'].includes(g)) return statusColors.grade.average;
	if (['PP', 'DEF'].includes(g)) return statusColors.grade.incomplete;
	if (['NM'].includes(g)) return statusColors.grade.incomplete;
	if (['F', 'FX', 'FIN', 'D', 'D+', 'D-', 'E', 'E+', 'E-'].includes(g))
		return statusColors.grade.poor;

	return 'gray';
}

export function getSemesterStatusColor(status: string) {
	return getStatusColor(status);
}

export function getActionColor(action: 'add' | 'remove' | 'update') {
	return statusColors.action[action];
}

export function getAlertColor(type: 'info' | 'warning' | 'error' | 'success') {
	return statusColors.alert[type];
}

export function getPercentageColor(
	percentage: number | null
): 'green' | 'yellow' | 'red' | 'gray' {
	if (percentage === null) return 'gray';
	if (percentage >= 75) return 'green';
	if (percentage >= 50) return 'yellow';
	return 'red';
}

export function getPointsColor(points: number | null) {
	if (points === null) return 'gray';
	if (points >= 4.0) return 'green';
	if (points >= 3.0) return 'blue';
	if (points >= 2.0) return 'orange';
	return 'red';
}

export function getStudentStatusColor(status: string) {
	return getStatusColor(status);
}

export function getProgramStatusColor(status: string) {
	if (!status) return 'gray';
	const normalized = status.toLowerCase().replace(/\s+/g, '');
	if (normalized in statusColors.programStatus) {
		return statusColors.programStatus[
			normalized as keyof typeof statusColors.programStatus
		];
	}
	return getStatusColor(status);
}

export function getModuleTypeColor(type: string) {
	if (!type) return 'gray';
	const normalized = type.toLowerCase();

	if (normalized in statusColors.moduleType) {
		return statusColors.moduleType[
			normalized as keyof typeof statusColors.moduleType
		];
	}
	if (normalized.startsWith('repeat')) return statusColors.moduleType.repeat;
	if (normalized.startsWith('resit')) return statusColors.moduleType.resit;
	if (normalized === 'drop' || normalized === 'delete') return 'red';

	return 'gray';
}

export function getModuleStatusColor(status: string) {
	return getModuleTypeColor(status);
}

export function getQuizStateColor(
	state: string
): 'green' | 'red' | 'yellow' | 'orange' | 'gray' | 'blue' {
	const normalized = state.toLowerCase();
	if (normalized in statusColors.quizState) {
		return statusColors.quizState[
			normalized as keyof typeof statusColors.quizState
		] as 'green' | 'red' | 'yellow' | 'orange' | 'gray' | 'blue';
	}
	return 'gray';
}

export function getQuizStatusColor(
	isNotYetOpen: boolean,
	isClosed: boolean
): { label: string; color: string } {
	if (isNotYetOpen) {
		return { label: 'Not yet open', color: statusColors.status.notyetopen };
	}
	if (isClosed) {
		return { label: 'Closed', color: statusColors.status.closed };
	}
	return { label: 'Open', color: statusColors.status.open };
}

export function getAssignmentStatusColor(
	isOverdue: boolean,
	isUpcoming: boolean
): { label: string; color: string } {
	if (isOverdue) {
		return { label: 'Overdue', color: statusColors.status.overdue };
	}
	if (isUpcoming) {
		return { label: 'Upcoming', color: statusColors.status.upcoming };
	}
	return { label: 'Active', color: statusColors.status.active };
}

export function getQuestionTypeColor(questionType: string) {
	const normalized = questionType.toLowerCase();
	if (normalized in statusColors.questionType) {
		return statusColors.questionType[
			normalized as keyof typeof statusColors.questionType
		];
	}
	return 'gray';
}

export function getClassTypeColor(classType: string): string {
	const normalized = classType.toLowerCase();
	if (normalized in statusColors.classType) {
		return statusColors.classType[
			normalized as keyof typeof statusColors.classType
		];
	}
	return 'cyan.3';
}

export function getPassFailColor(hasPassed: boolean) {
	return hasPassed ? statusColors.boolean.true : statusColors.boolean.false;
}

export function getBooleanStatusColor(isActive: boolean) {
	return isActive ? 'green' : 'gray';
}

export function getActiveInactiveColor(isActive: boolean) {
	return isActive ? statusColors.boolean.true : statusColors.boolean.false;
}

export function getVisibilityColor(hidden: boolean) {
	return hidden ? 'red' : 'blue';
}

export function getClearanceStatusColor(status: string) {
	return getStatusColor(status);
}

export function getGenderColor(gender: string) {
	const normalized = gender.toLowerCase();
	if (normalized in statusColors.gender) {
		return statusColors.gender[normalized as keyof typeof statusColors.gender];
	}
	return 'gray.6';
}

export function getProgramLevelColor(level: string) {
	const normalized = level.toLowerCase();
	if (normalized in statusColors.programLevel) {
		return statusColors.programLevel[
			normalized as keyof typeof statusColors.programLevel
		];
	}
	return 'gray.6';
}

export function getChartSemesterStatusColor(status: string) {
	const normalized = status.toLowerCase().replace(/\s+/g, '');
	if (normalized in statusColors.semesterStatus) {
		return statusColors.semesterStatus[
			normalized as keyof typeof statusColors.semesterStatus
		];
	}
	return 'gray.6';
}

export function getPostTypeColor(type: 'announcement' | 'discussion') {
	return statusColors.postType[type];
}

export function getOverdueColor(isOverdue: boolean) {
	return isOverdue ? 'red' : 'blue';
}

export function getBlockedStatusColor(isBlocked: boolean) {
	return isBlocked
		? statusColors.status.blocked
		: statusColors.status.unblocked;
}

export function getNotificationColor(
	type: 'success' | 'error' | 'warning' | 'info'
) {
	return statusColors.notification[type];
}

export function getMarksPercentageColor(
	marks: number | null | undefined,
	maxMarks: number
): 'green' | 'red' | 'gray' {
	if (marks === null || marks === undefined) return 'gray';
	const percentage = (marks / maxMarks) * 100;
	return percentage >= 50 ? 'green' : 'red';
}

export function getRequestStatusColor(
	status: 'registered' | 'rejected' | 'pending' | string
) {
	const normalized = status.toLowerCase();
	if (normalized in statusColors.requestStatus) {
		return statusColors.requestStatus[
			normalized as keyof typeof statusColors.requestStatus
		];
	}
	return 'gray';
}

export function getCorrectAnswerColor(isCorrect: boolean) {
	return isCorrect ? 'green' : 'gray';
}

export function getCopiedColor(copied: boolean) {
	return copied ? 'teal' : 'gray';
}

export function getHiddenTextColor(hidden: boolean) {
	return hidden ? 'dark' : undefined;
}

export function getModuleStatusTextColor(status: string) {
	const normalized = status.toLowerCase();
	if (normalized.startsWith('repeat')) return 'red';
	return undefined;
}

export function getDroppedDeletedColor(isDroppedOrDeleted: boolean) {
	return isDroppedOrDeleted ? 'dimmed' : undefined;
}

export function getNavActiveColor(isActive: boolean) {
	return isActive ? 'blue' : 'dimmed';
}

export function getFilterActiveColor(hasActiveFilters: boolean) {
	return hasActiveFilters ? 'blue' : undefined;
}

export function getImportResultColor(success: boolean) {
	return success ? 'green' : 'orange';
}

export function getTaskPriorityColor(priority: string) {
	if (!priority) return 'gray';
	const normalized = priority.toLowerCase();
	if (normalized in statusColors.taskPriority) {
		return statusColors.taskPriority[
			normalized as keyof typeof statusColors.taskPriority
		];
	}
	return 'gray';
}

export function getTaskStatusColor(status: string) {
	if (!status) return 'gray';
	const normalized = status.toLowerCase().replace(/\s+/g, '');
	if (normalized in statusColors.taskStatus) {
		return statusColors.taskStatus[
			normalized as keyof typeof statusColors.taskStatus
		];
	}
	return 'gray';
}

export function getVersionCountColor(
	count: number
): 'green' | 'yellow' | 'red' {
	if (count === 1) return statusColors.versionCount.first as 'green';
	if (count <= 3) return statusColors.versionCount.few as 'yellow';
	return statusColors.versionCount.many as 'red';
}

export function getTermMismatchColor(isCurrentTerm: boolean) {
	return isCurrentTerm ? undefined : 'red';
}

export function getSemesterResultColor(status: string) {
	const normalized = status.toLowerCase();
	if (normalized === 'active') return 'green';
	if (normalized === 'repeat') return 'orange';
	return getStatusColor(status);
}

export function getOverdueTextColor(isOverdue: boolean) {
	return isOverdue ? 'red' : 'dimmed';
}

export function getExceededLimitColor(isExceeded: boolean) {
	return isExceeded ? 'red' : 'blue';
}

export function getEmptyValueColor(hasValue: boolean) {
	return hasValue ? undefined : 'dimmed';
}

export function getAuditActionColor(action: 'create' | 'update' | 'delete') {
	return statusColors.action[
		action === 'create' ? 'add' : action === 'delete' ? 'remove' : 'update'
	];
}
