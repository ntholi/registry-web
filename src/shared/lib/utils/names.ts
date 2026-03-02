function capitalizeNamePart(part: string) {
	if (!part) return '';
	const lower = part.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
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

function hasMixedCase(value: string) {
	return /[A-Z]/.test(value) && /[a-z]/.test(value);
}

function isRomanNumeral(value: string) {
	return /^[ivxlcdm]+$/i.test(value);
}

function isInitials(value: string) {
	return /^([a-z]\.){2,}$/i.test(value);
}

function normalizeApostrophePart(part: string) {
	const sections = part.split("'");
	const firstSection = sections[0] ?? '';
	const firstLower = firstSection.toLowerCase();
	const keepFirstLower = LOWER_APOSTROPHE_PREFIXES.has(firstLower);
	const capitalizeSuffixes = keepFirstLower || firstLower.length === 1;

	return sections
		.map((section, idx) => {
			if (!section) return section;
			if (idx === 0) {
				if (keepFirstLower) return firstLower;
				return capitalizeNamePart(section);
			}
			if (capitalizeSuffixes) {
				return capitalizeNamePart(section);
			}
			return section.toLowerCase();
		})
		.join("'");
}

function repairDistortedNameWordPart(part: string) {
	if (!part) return '';

	let repaired = part;
	const apostropheMatch = repaired.match(/^([A-Za-z]{2,})'([A-Z][a-z]+)$/);
	if (apostropheMatch) {
		const [, first, second] = apostropheMatch;
		repaired = `${capitalizeNamePart(first)}'${second.toLowerCase()}`;
	}

	return repaired;
}

export function repairDistortedPersonName(name: string | undefined | null) {
	if (name === undefined || name === null) return undefined;
	if (!name.trim()) return undefined;
	return name
		.trim()
		.replace(/\s+/g, ' ')
		.split(' ')
		.map((word) =>
			word
				.split('-')
				.map((part) => repairDistortedNameWordPart(part))
				.join('-')
		)
		.join(' ');
}

function normalizeNameWordPart(part: string) {
	if (!part) return '';
	const lowerPart = part.toLowerCase();
	if (LOWER_NAME_PARTICLES.has(lowerPart)) return lowerPart;
	if (isInitials(lowerPart)) return lowerPart.toUpperCase();
	if (isRomanNumeral(lowerPart)) return lowerPart.toUpperCase();
	if (/^st\.?$/i.test(part)) return 'St.';
	if (part.includes("'")) return normalizeApostrophePart(part);
	if (hasMixedCase(part)) return part;
	return capitalizeNamePart(lowerPart);
}

export function formatPersonName(name: string | undefined | null) {
	const repairedName = repairDistortedPersonName(name);
	if (!repairedName) return undefined;
	return repairedName
		.trim()
		.replace(/\s+/g, ' ')
		.split(' ')
		.map((word) =>
			word
				.split('-')
				.map((part) => normalizeNameWordPart(part))
				.join('-')
		)
		.join(' ');
}
