export const REGISTRATION_CLEARANCE_DEPTS = ['finance'] as const;
export const GRADUATION_CLEARANCE_DEPTS = ['finance', 'academic'] as const;

export type ClearanceDept =
	| (typeof REGISTRATION_CLEARANCE_DEPTS)[number]
	| (typeof GRADUATION_CLEARANCE_DEPTS)[number];
