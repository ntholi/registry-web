export type WizardStep = {
	label: string;
	path: string;
	description: string;
};

export const WIZARD_STEPS: WizardStep[] = [
	{
		label: 'Documents',
		path: 'documents',
		description: 'Upload identity documents',
	},
	{
		label: 'Qualifications',
		path: 'qualifications',
		description: 'Academic records',
	},
	{
		label: 'Program',
		path: 'program',
		description: 'Choose your courses',
	},
	{
		label: 'Personal Info',
		path: 'personal-info',
		description: 'Contact & guardians',
	},
	{
		label: 'Review',
		path: 'review',
		description: 'Submit application',
	},
];

export function getStepIndex(path: string): number {
	const idx = WIZARD_STEPS.findIndex((s) => s.path === path);
	return idx === -1 ? 0 : idx;
}
