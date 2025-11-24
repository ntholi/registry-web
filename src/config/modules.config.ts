export type ModuleKey =
	| 'academic'
	| 'admin'
	| 'classroom'
	| 'finance'
	| 'registry'
	| 'timetable'
	| 'student-portal'
	| 'audit-logs';

const moduleEnvKeys: Record<ModuleKey, string> = {
	academic: 'ENABLE_MODULE_ACADEMIC',
	admin: 'ENABLE_MODULE_ADMIN',
	classroom: 'ENABLE_MODULE_CLASSROOM',
	finance: 'ENABLE_MODULE_FINANCE',
	registry: 'ENABLE_MODULE_REGISTRY',
	timetable: 'ENABLE_MODULE_TIMETABLE',
	'student-portal': 'ENABLE_MODULE_STUDENT_PORTAL',
	'audit-logs': 'ENABLE_MODULE_AUDIT_LOGS',
};

function isModuleEnabled(moduleKey: ModuleKey): boolean {
	const envKey = moduleEnvKeys[moduleKey];
	const envValue = process.env[envKey];

	if (envValue === undefined || envValue === '') {
		return true;
	}

	return envValue.toLowerCase() === 'true';
}

export const moduleConfig = {
	academic: isModuleEnabled('academic'),
	admin: isModuleEnabled('admin'),
	classroom: isModuleEnabled('classroom'),
	finance: isModuleEnabled('finance'),
	registry: isModuleEnabled('registry'),
	timetable: isModuleEnabled('timetable'),
	studentPortal: isModuleEnabled('student-portal'),
	auditLogs: isModuleEnabled('audit-logs'),
};

export function getEnabledModules(): ModuleKey[] {
	return (Object.keys(moduleEnvKeys) as ModuleKey[]).filter(isModuleEnabled);
}

export function checkModuleAccess(moduleKey: ModuleKey): boolean {
	return isModuleEnabled(moduleKey);
}

export function getModuleConfig() {
	return {
		academic: moduleConfig.academic,
		admin: moduleConfig.admin,
		classroom: moduleConfig.classroom,
		finance: moduleConfig.finance,
		registry: moduleConfig.registry,
		timetable: moduleConfig.timetable,
		studentPortal: moduleConfig.studentPortal,
		auditLogs: moduleConfig.auditLogs,
	};
}

export type ClientModuleConfig = ReturnType<typeof getModuleConfig>;
