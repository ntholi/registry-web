function capitalizeNamePart(part: string) {
	if (!part) return '';
	return part.charAt(0).toUpperCase() + part.slice(1);
}

const LOWER_NAME_PARTICLES = new Set([
	'al',
	'bin',
	'da',
	'das',
	'de',
	'del',
	'della',
	'di',
	'do',
	'dos',
	'du',
	'el',
	'ibn',
	'la',
	'le',
	'van',
	'von',
]);

const LOWER_APOSTROPHE_PREFIXES = new Set(['d', 'l']);
const APOSTROPHE_LONG_PREFIX_MIN_LENGTH = 3;

function isRomanNumeral(value: string) {
	return /^[ivxlcdm]+$/i.test(value);
}

function isInitials(value: string) {
	return /^([a-z]\.){2,}$/i.test(value);
}

function normalizeApostrophePart(part: string) {
	const sections = part.split("'");
	return sections
		.map((section, idx) => {
			if (!section) return section;
			if (idx === 0 && LOWER_APOSTROPHE_PREFIXES.has(section)) {
				return section.toLowerCase();
			}
			if (idx > 0 && sections[0].length >= APOSTROPHE_LONG_PREFIX_MIN_LENGTH) {
				return section.toLowerCase();
			}
			return capitalizeNamePart(section);
		})
		.join("'");
}

function normalizeNameWordPart(part: string) {
	if (!part) return '';
	if (LOWER_NAME_PARTICLES.has(part)) return part.toLowerCase();
	if (isInitials(part)) return part.toUpperCase();
	if (isRomanNumeral(part)) return part.toUpperCase();
	if (/^st\.?$/i.test(part)) return 'St.';
	if (/^mc[a-z]{1,}$/i.test(part)) {
		return `Mc${capitalizeNamePart(part.slice(2))}`;
	}
	if (/^mac[a-z]{1,}$/i.test(part)) {
		return `Mac${capitalizeNamePart(part.slice(3))}`;
	}
	if (part.includes("'")) return normalizeApostrophePart(part);
	return capitalizeNamePart(part);
}

export function formatPersonName(name: string | undefined | null) {
	if (name === undefined || name === null) return undefined;
	if (!name.trim()) return undefined;
	return name
		.trim()
		.replace(/\s+/g, ' ')
		.toLowerCase()
		.split(' ')
		.map((word) =>
			word
				.split('-')
				.map((part) => normalizeNameWordPart(part))
				.join('-')
		)
		.join(' ');
}
