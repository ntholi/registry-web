const DEGREE_EXPANSIONS: Record<string, string> = {
	BA: 'Bachelor of Arts',
	BSc: 'Bachelor of Science',
	'B Bus': 'Bachelor of Business',
	BCom: 'Bachelor of Commerce',
	BEd: 'Bachelor of Education',
	BEng: 'Bachelor of Engineering',
	BFA: 'Bachelor of Fine Arts',
	BIT: 'Bachelor of Information Technology',
	BN: 'Bachelor of Nursing',
	LLB: 'Bachelor of Laws',
	MA: 'Master of Arts',
	MSc: 'Master of Science',
	MBA: 'Master of Business Administration',
	MEd: 'Master of Education',
	MEng: 'Master of Engineering',
	MFA: 'Master of Fine Arts',
	MIT: 'Master of Information Technology',
	LLM: 'Master of Laws',
	PhD: 'Doctor of Philosophy',
	DBA: 'Doctor of Business Administration',
	EdD: 'Doctor of Education',
};

export function expandProgramName(programName: string): string {
	const hasHons = programName.includes('(Hons)');
	const workingName = programName
		.replace(' (Hons)', '')
		.replace('(Hons)', '')
		.trim();

	for (const [abbrev, fullName] of Object.entries(DEGREE_EXPANSIONS)) {
		if (workingName.trim() === abbrev) {
			return hasHons ? `${fullName} (Hons)` : fullName;
		}

		if (workingName.startsWith(`${abbrev} `)) {
			const expanded = workingName.replace(`${abbrev} `, `${fullName} `);
			if (hasHons) {
				if (expanded.includes(' in ')) {
					const parts = expanded.split(' in ');
					return `${parts[0]} (Hons) in ${parts.slice(1).join(' in ')}`;
				}
				return `${expanded} (Hons)`;
			}
			return expanded;
		}
	}

	return programName;
}

function prependProgramLevel(programName: string, programCode: string): string {
	if (programName.startsWith('Associate')) {
		return `AD${programCode}`;
	}
	return programCode;
}

export function buildCertificateReference(
	programName: string,
	programCode: string,
	stdNo: number
): string {
	const normalizedCode = prependProgramLevel(programName, programCode);
	return `LSO${normalizedCode}${stdNo}`;
}

export { formatIssueDate } from '@/shared/lib/utils/dates';
