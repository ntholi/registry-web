import type { AppConfig } from './index';

const config: AppConfig = {
	staffEmailDomain: '@limkokwing.ac.sz',
	registry: {
		maxRegModules: 8,
		maxRegistrationAttempts: 2,
	},
	timetable: {
		timetableAllocations: {
			maxSlotsPerDay: 3,
			duration: 120,
			allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
			startTime: '08:00:00',
			endTime: '17:00:00',
		},
	},
};

export default config;
