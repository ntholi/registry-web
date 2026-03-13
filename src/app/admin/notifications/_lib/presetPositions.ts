import type { DashboardRole } from '@/core/auth/permissions';

type LegacyPresetPosition =
	| 'manager'
	| 'program_leader'
	| 'principal_lecturer'
	| 'year_leader'
	| 'lecturer'
	| 'admin';

interface LegacyPresetMapping {
	role: DashboardRole;
	position: LegacyPresetPosition | null;
	presetName: string;
}

const LEGACY_PRESET_MAPPINGS: readonly LegacyPresetMapping[] = [
	{ role: 'academic', position: 'manager', presetName: 'Academic Manager' },
	{
		role: 'academic',
		position: 'program_leader',
		presetName: 'Academic Program Leader',
	},
	{
		role: 'academic',
		position: 'year_leader',
		presetName: 'Academic Year Leader',
	},
	{ role: 'academic', position: 'lecturer', presetName: 'Academic Lecturer' },
	{
		role: 'academic',
		position: 'principal_lecturer',
		presetName: 'Academic Principal Lecturer',
	},
	{ role: 'academic', position: 'admin', presetName: 'Academic Admin' },
	{ role: 'academic', position: null, presetName: 'Academic Lecturer' },
	{ role: 'registry', position: null, presetName: 'Registry Staff' },
	{ role: 'registry', position: 'manager', presetName: 'Registry Manager' },
	{ role: 'finance', position: null, presetName: 'Finance Staff' },
	{ role: 'finance', position: 'manager', presetName: 'Finance Manager' },
	{ role: 'library', position: null, presetName: 'Library Staff' },
	{ role: 'marketing', position: null, presetName: 'Marketing Staff' },
	{
		role: 'student_services',
		position: null,
		presetName: 'Student Services Staff',
	},
	{ role: 'leap', position: null, presetName: 'LEAP Staff' },
	{
		role: 'human_resource',
		position: null,
		presetName: 'Human Resource Staff',
	},
	{ role: 'resource', position: null, presetName: 'Resource Staff' },
];

export const LEGACY_PRESET_POSITIONS = [
	'manager',
	'program_leader',
	'principal_lecturer',
	'year_leader',
	'lecturer',
	'admin',
] as const;

export function resolvePresetPosition(
	role: string | null | undefined,
	presetName: string | null | undefined
) {
	if (!role || !presetName) {
		return null;
	}

	return (
		LEGACY_PRESET_MAPPINGS.find(
			(mapping) => mapping.role === role && mapping.presetName === presetName
		)?.position ?? null
	);
}
