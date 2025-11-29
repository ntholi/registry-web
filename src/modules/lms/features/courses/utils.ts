export type ShortnameParts = { code: string; term: string | null };

export function splitShortName(shortname: string): ShortnameParts {
	const parts = shortname.split('_');
	return {
		code: parts[0] || shortname,
		term: parts[1] || null,
	};
}
