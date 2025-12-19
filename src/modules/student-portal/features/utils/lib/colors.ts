export const statusColors = {
	status: {
		active: 'green',
		approved: 'green',
		registered: 'blue',
		rejected: 'red',
		partial: 'gray',
		pending: 'yellow',
		enrolled: 'gray',
		outstanding: 'dark',
		deleted: 'red',
		inactive: 'red',
		dnr: 'red',
		droppedout: 'red',
		deferred: 'yellow',
		exempted: 'blue',
		repeat: 'violet',
		drop: 'red',
		delete: 'red',
		open: 'green',
		closed: 'red',
		notyetopen: 'gray',
	},
	grade: {
		excellent: 'green',
		good: 'blue',
		average: 'yellow',
		poor: 'red',
		incomplete: 'orange',
	},
	theme: {
		primary: 'gray',
		secondary: 'orange',
		accent: 'violet',
	},
} as const;

export const getStatusColor = (status: string) => {
	const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');
	if (normalizedStatus in statusColors.status) {
		return statusColors.status[normalizedStatus as keyof typeof statusColors.status];
	}
	
	if (normalizedStatus.includes('pending')) return statusColors.status.pending;
	if (normalizedStatus.includes('reject')) return statusColors.status.rejected;
	if (normalizedStatus.includes('pass') || normalizedStatus.includes('success')) return statusColors.status.active;
	
	return 'gray';
};

export const getGradeColor = (grade: string) => {
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
