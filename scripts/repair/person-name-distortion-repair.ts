export interface DistortionRuleCounts {
	apostropheMiddle: number;
	apostropheLeading: number;
	apostropheUnicode: number;
	legacyMacVariant: number;
}

export interface LegacyRepairResult {
	repairedName: string;
	changed: boolean;
	rules: DistortionRuleCounts;
}

function createEmptyRuleCounts(): DistortionRuleCounts {
	return {
		apostropheMiddle: 0,
		apostropheLeading: 0,
		apostropheUnicode: 0,
		legacyMacVariant: 0,
	};
}

function capitalizeFirst(value: string) {
	if (!value) return '';
	return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function mergeRuleCounts(
	target: DistortionRuleCounts,
	source: DistortionRuleCounts
) {
	target.apostropheMiddle += source.apostropheMiddle;
	target.apostropheLeading += source.apostropheLeading;
	target.apostropheUnicode += source.apostropheUnicode;
	target.legacyMacVariant += source.legacyMacVariant;
}

const APOSTROPHE_VARIANTS = /[\u2018\u2019\u02BC\u0060\u00B4]/g;

const KNOWN_INTENTIONAL_MAC_SURNAMES = new Set([
	'MacArthur',
	'MacAulay',
	'MacBride',
	'MacCallum',
	'MacDonald',
	'MacDougall',
	'MacDowell',
	'MacDuff',
	'MacFarlane',
	'MacGillivray',
	'MacGregor',
	'MacInnes',
	'MacIntosh',
	'MacIntyre',
	'MacKay',
	'MacKenzie',
	'MacKinnon',
	'MacLeod',
	'MacMillan',
	'MacNab',
	'MacNeill',
	'MacPherson',
]);

const KNOWN_INTENTIONAL_MAC_SURNAMES_BY_LOWER = new Map(
	[...KNOWN_INTENTIONAL_MAC_SURNAMES].map((value) => [
		value.toLowerCase(),
		value,
	])
);

function normalizeApostropheVariants(value: string) {
	const matches = value.match(APOSTROPHE_VARIANTS);
	if (!matches) {
		return { normalized: value, replacements: 0 };
	}

	return {
		normalized: value.replace(APOSTROPHE_VARIANTS, "'"),
		replacements: matches.length,
	};
}

function repairLegacyMacVariant(part: string) {
	const canonicalKnown = KNOWN_INTENTIONAL_MAC_SURNAMES_BY_LOWER.get(
		part.toLowerCase()
	);
	if (canonicalKnown) {
		return { repaired: canonicalKnown, changed: canonicalKnown !== part };
	}

	if (/^Mac[A-Z][a-z]+$/.test(part)) {
		return { repaired: capitalizeFirst(part), changed: true };
	}

	if (/^MaC[A-Z][a-z]+$/.test(part)) {
		return { repaired: capitalizeFirst(part), changed: true };
	}

	if (/^mAc[A-Z][a-z]+$/.test(part)) {
		return { repaired: capitalizeFirst(part), changed: true };
	}

	if (/^mac[A-Z][a-z]+$/.test(part)) {
		return { repaired: capitalizeFirst(part), changed: true };
	}

	return { repaired: part, changed: false };
}

export function repairLegacyDistortedWordPart(part: string) {
	const rules = createEmptyRuleCounts();
	if (!part) {
		return { repairedPart: part, changed: false, rules };
	}

	const apostropheNormalized = normalizeApostropheVariants(part);
	let repairedPart = apostropheNormalized.normalized;
	rules.apostropheUnicode += apostropheNormalized.replacements;

	const apostropheMiddleUpperMatch = repairedPart.match(
		/^([A-Za-z]{2,})'([A-Z][A-Za-z]*)$/
	);
	if (apostropheMiddleUpperMatch) {
		const [, prefix, suffix] = apostropheMiddleUpperMatch;
		repairedPart = `${capitalizeFirst(prefix)}'${suffix.toLowerCase()}`;
		rules.apostropheMiddle += 1;
	}

	const apostropheLeadingMatch = repairedPart.match(/^'([A-Z][A-Za-z]*)$/);
	if (apostropheLeadingMatch) {
		const [, suffix] = apostropheLeadingMatch;
		repairedPart = `'${capitalizeFirst(suffix)}`;
		rules.apostropheLeading += 1;
	}

	const macResult = repairLegacyMacVariant(repairedPart);
	if (macResult.changed) {
		repairedPart = macResult.repaired;
		rules.legacyMacVariant += 1;
	}

	return {
		repairedPart,
		changed: repairedPart !== part,
		rules,
	};
}

export function repairLegacyDistortedPersonName(
	name: string | null | undefined
): LegacyRepairResult | undefined {
	if (name === null || name === undefined) return undefined;
	if (!name.trim()) return undefined;

	const parts = name.split(/(\s+|-)/);
	const aggregateRules = createEmptyRuleCounts();
	let changed = false;

	const repairedParts = parts.map((part) => {
		if (!part || /^\s+$/.test(part) || part === '-') return part;
		const result = repairLegacyDistortedWordPart(part);
		if (result.changed) changed = true;
		mergeRuleCounts(aggregateRules, result.rules);
		return result.repairedPart;
	});

	return {
		repairedName: repairedParts.join(''),
		changed,
		rules: aggregateRules,
	};
}
