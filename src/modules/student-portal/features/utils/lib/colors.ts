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
		inactive: 'red',
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
} as const;

export const getStatusColor = (status: string) => {
	if (!status) return 'gray';
	const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');

	// Direct match
	if (normalizedStatus in statusColors.status) {
		return statusColors.status[
			normalizedStatus as keyof typeof statusColors.status
		];
	}

	// Fuzzy match
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
};

export const getGradeColor = (grade: string) => {
	if (!grade) return 'gray';
	const g = grade.toUpperCase();
	if (['A+', 'A', 'A-'].includes(g)) return statusColors.grade.excellent;
	if (['B+', 'B', 'B-'].includes(g)) return statusColors.grade.good;
	if (['C+', 'C', 'C-'].includes(g)) return statusColors.grade.average;
	if (['NM', 'DEF'].includes(g)) return statusColors.grade.incomplete;
	return statusColors.grade.poor;
};

export const getSemesterStatusColor = (status: string) => {
	return getStatusColor(status);
};

export const getActionColor = (action: 'add' | 'remove' | 'update') => {
	return statusColors.action[action];
};

export const getAlertColor = (
	type: 'info' | 'warning' | 'error' | 'success'
) => {
	return statusColors.alert[type];
};
