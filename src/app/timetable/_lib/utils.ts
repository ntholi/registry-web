import { getStudentClassName } from '@/shared/lib/utils/utils';

export function toClassName(
	semesterModule: {
		semester?: {
			semesterNumber: string;
			structure?: {
				program: {
					code: string;
				};
			};
		} | null;
	},
	groupName: string | null
) {
	if (!semesterModule.semester || !semesterModule.semester.structure)
		return 'Unknown';
	return `${getStudentClassName(semesterModule.semester as { semesterNumber: string; structure: { program: { code: string } } })}${groupName ? `${groupName}` : ''}`;
}

export function formatDuration(totalMinutes: number): string {
	if (totalMinutes <= 0) return '0 hours';
	const hours = Math.floor(totalMinutes / 60);
	const mins = totalMinutes % 60;

	if (hours === 0) {
		return `${mins} minute${mins !== 1 ? 's' : ''}`;
	}
	if (mins === 0) {
		return `${hours} hour${hours !== 1 ? 's' : ''}`;
	}
	return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
}

export function addMinutesToTime(time: string, minutes: number): string {
	const [hours, mins] = time.split(':').map(Number);
	const totalMinutes = hours * 60 + mins + minutes;
	const newHours = Math.floor(totalMinutes / 60) % 24;
	const newMins = totalMinutes % 60;
	return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
}
