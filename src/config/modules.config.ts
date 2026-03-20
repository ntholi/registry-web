export type ModuleKey =
	| 'academic'
	| 'admin'
	| 'admissions'
	| 'appraisals'
	| 'lms'
	| 'finance'
	| 'mail'
	| 'registry'
	| 'reports'
	| 'timetable'
	| 'student-portal'
	| 'audit-logs'
	| 'library'
	| 'human-resource';

const moduleEnvKeys: Record<ModuleKey, string> = {
	academic: 'ENABLE_MODULE_ACADEMIC',
	admin: 'ENABLE_MODULE_ADMIN',
	admissions: 'ENABLE_MODULE_ADMISSIONS',
	appraisals: 'ENABLE_MODULE_APPRAISALS',
	lms: 'ENABLE_MODULE_LMS',
	finance: 'ENABLE_MODULE_FINANCE',
	mail: 'ENABLE_MODULE_MAIL',
	registry: 'ENABLE_MODULE_REGISTRY',
	reports: 'ENABLE_MODULE_REPORTS',
	timetable: 'ENABLE_MODULE_TIMETABLE',
	'student-portal': 'ENABLE_MODULE_STUDENT_PORTAL',
	'audit-logs': 'ENABLE_MODULE_AUDIT_LOGS',
	library: 'ENABLE_MODULE_LIBRARY',
	'human-resource': 'ENABLE_MODULE_HUMAN_RESOURCE',
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
	admissions: isModuleEnabled('admissions'),
	appraisals: isModuleEnabled('appraisals'),
	lms: isModuleEnabled('lms'),
	finance: isModuleEnabled('finance'),
	mail: isModuleEnabled('mail'),
	registry: isModuleEnabled('registry'),
	reports: isModuleEnabled('reports'),
	timetable: isModuleEnabled('timetable'),
	studentPortal: isModuleEnabled('student-portal'),
	auditLogs: isModuleEnabled('audit-logs'),
	library: isModuleEnabled('library'),
	humanResource: isModuleEnabled('human-resource'),
};

export function getModuleConfig() {
	return {
		academic: moduleConfig.academic,
		admin: moduleConfig.admin,
		admissions: moduleConfig.admissions,
		appraisals: moduleConfig.appraisals,
		lms: moduleConfig.lms,
		finance: moduleConfig.finance,
		mail: moduleConfig.mail,
		registry: moduleConfig.registry,
		reports: moduleConfig.reports,
		timetable: moduleConfig.timetable,
		studentPortal: moduleConfig.studentPortal,
		auditLogs: moduleConfig.auditLogs,
		library: moduleConfig.library,
		humanResource: moduleConfig.humanResource,
	};
}

export type ClientModuleConfig = ReturnType<typeof getModuleConfig>;
