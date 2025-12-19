export const statusColors = {
	status: {
		active: 'green',
		approved: 'green',
		registered: 'blue',
		rejected: 'red',
		partial: 'gray',
		pending: 'yellow',
	},
	grade: {
		excellent: 'green',
		good: 'blue',
		average: 'yellow',
		poor: 'red',
	},
	theme: {
		primary: 'gray',
		secondary: 'orange',
		accent: 'violet',
	},
} as const;

export const getStatusColor = (status: string) => {
	const normalizedStatus = status.toLowerCase();
	return (
		statusColors.status[normalizedStatus as keyof typeof statusColors.status] ||
		'gray'
	);
};

export const getGradeColor = (grade: string) => {
	if (['A+', 'A', 'A-'].includes(grade)) return statusColors.grade.excellent;
	if (['B+', 'B', 'B-'].includes(grade)) return statusColors.grade.good;
	if (['C+', 'C', 'C-'].includes(grade)) return statusColors.grade.average;
	return statusColors.grade.poor;
};
