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
	apply: {
		banking: {
			bankName: 'Standard Lesotho Bank',
			accountHolder: 'Limkokwing University of Creative Technology',
			accountNumber: '9080003987813',
			branchCode: '060667',
			beneficiaryVariations: [
				'limkokwing university of creative technology',
				'limkokwing university',
				'luct',
				'limkokwing',
			],
			salesReceiptIssuers: [
				'limkokwing university of creative technology',
				'limkokwing university',
				'luct',
				'limkokwing',
			],
		},
	},
};

export default config;
