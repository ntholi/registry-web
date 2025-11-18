export type DayOfWeek =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

export type AppConfig = {
	timetable: {
		timetableAllocations: {
			maxSlotsPerDay: number; // Maximum number of slots (class) a lecturer or student class can have per day
			duration: number;
			allowedDays: DayOfWeek[];
			startTime: string;
			endTime: string;
		};
	};
};

const configMap = {
	lesotho: () => import('./lesotho.config'),
	eswatini: () => import('./eswatini.config'),
} as const;

type ConfigName = keyof typeof configMap;

async function loadConfig(): Promise<AppConfig> {
	const configName = (process.env.NEXT_PUBLIC_CONFIG ||
		'lesotho') as ConfigName;

	if (!(configName in configMap)) {
		throw new Error(
			`Invalid config name: ${configName}. Available configs: ${Object.keys(configMap).join(', ')}`
		);
	}

	const configModule = await configMap[configName]();
	return configModule.default;
}

export const config = await loadConfig();
