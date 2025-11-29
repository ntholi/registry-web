export type ShortnameParts = { code: string; term: string | null };

export function extractShort(fullname: string): ShortnameParts {
	const parts = fullname.split('_');
	return {
		code: parts[0] || fullname,
		term: parts[1] || null,
	};
}
