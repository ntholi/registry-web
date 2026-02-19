export type ShortnameParts = {
	term: string | null;
	code: string;
	studentClass: string | null;
};

export function splitShortName(shortname: string): ShortnameParts {
	const parts = shortname.split('_');
	if (parts.length >= 3) {
		return {
			term: parts[0],
			code: parts[1],
			studentClass: parts.slice(2).join('_'),
		};
	}
	if (parts.length === 2) {
		return {
			term: parts[1],
			code: parts[0],
			studentClass: null,
		};
	}
	return {
		term: null,
		code: parts[0] || shortname,
		studentClass: null,
	};
}
