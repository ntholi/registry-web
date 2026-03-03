export interface NameCaseVariant {
	title: string;
	lower: string;
	upper: string;
}

export interface TrickyNameCase {
	expected: string;
	inputs: string[];
}

function withApostropheVariant(value: string, apostrophe: string) {
	return value.replace(/'/g, apostrophe);
}

function toCaseVariant(title: string): NameCaseVariant {
	return {
		title,
		lower: title.toLowerCase(),
		upper: title.toUpperCase(),
	};
}

function capitalizeLegacyPart(part: string) {
	if (!part) return '';
	const lower = part.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toLegacyDistortedPart(part: string) {
	const normalized = part.replace(/[\u2018\u2019\u02BC\u0060\u00B4]/g, "'");
	const lower = normalized.toLowerCase();

	if (lower.includes("'")) {
		const sections = lower.split("'");
		return sections
			.map((section, idx) => {
				if (!section) return section;
				if (idx > 0 && (sections[0]?.length ?? 0) < 3) {
					return capitalizeLegacyPart(section);
				}
				if (idx > 0) return section.toLowerCase();
				return capitalizeLegacyPart(section);
			})
			.join("'");
	}

	return capitalizeLegacyPart(lower);
}

export function simulateLegacyDistortion(name: string) {
	return name
		.trim()
		.replace(/\s+/g, ' ')
		.toLowerCase()
		.split(' ')
		.map((word) =>
			word
				.split('-')
				.map((part) => toLegacyDistortedPart(part))
				.join('-')
		)
		.join(' ');
}

export const sesothoGivenNames = [
	"Ts'ele",
	"Nts'ebo",
	"Mants'ebo",
	"Mats'eliso",
	"Nts'okoleng",
	"Mots'eoa",
	"Khots'eng",
	"Pont'so",
	"Lits'itso",
	"Ts'itso",
	"Ts'iame",
	"Lets'olo",
	"Mants'o",
	"'Neheng",
	"'Nyane",
	"Mokotjo-'Masechaba",
	"Lerato-Ts'episo",
	'Thabiso-Mpho',
	'Neo',
	'Lerato',
	'Mpho',
	'Lineo',
	'Puseletso',
	'Boitumelo',
	'Nthabiseng',
	'Nteboheleng',
	'Mokete',
	'Masechaba',
	'Mpho-Lerato',
	'Neo-Lerato',
	'Teboho',
	'Puleng',
	'Mamorena',
	'Khotso',
	'Lesego',
	'Molemo',
	'Keneuoe',
	'Mantsopa',
	'Matlotliso',
	'Rethabile',
	'Matšeliso',
	'Tšepiso',
	'Paballo',
].map((value) => toCaseVariant(value));

export const sesothoSurnames = [
	'Mokoena',
	'Mokone',
	'Mofokeng',
	'Phafoli',
	'Ramathe',
	'Rantlo',
	'Qhobela',
	'Rasethuntsha',
	'Sephooa',
	'Moleleki',
	'Mosoetsa',
	'Mathe',
	'Motebang',
	'Mothepu',
	'Maqhama',
	'Letlaka',
	'Lekhooana',
	'Mokoteli',
	'Rasehloho',
	'Thulo',
	"Mo'letsane",
	"'Makhauta",
	"'Mathulo",
	"'Mapitso",
	'Tlali',
	'Kolobe',
	'Thejane',
	'Mashale',
	'Sehlabaka',
	'Mokhothu',
	'Makoa',
	'Makoanyane',
	'Mahlape',
	'Maqutu',
	'Mosiuoa',
	'Rakhali',
	'Maseko',
	'Khaketla',
	'Bokang',
	'Mathibeli',
	'Mosaqhane',
	'Matlala',
	'Machobane',
	'Macheli',
].map((value) => toCaseVariant(value));

export const trickyNonSesothoCases: TrickyNameCase[] = [
	{
		expected: "O'Connor",
		inputs: ["O'Connor", "o'connor", 'O’CONNOR'],
	},
	{
		expected: "d'Artagnan",
		inputs: ["d'Artagnan", "d'artagnan", 'D’ARTAGNAN'],
	},
	{
		expected: 'Jean-Luc Picard',
		inputs: ['jean-luc picard', 'JEAN-LUC PICARD', 'Jean-Luc Picard'],
	},
	{
		expected: 'van Gogh',
		inputs: ['van gogh', 'VAN GOGH', 'van Gogh'],
	},
	{
		expected: 'de la Rosa',
		inputs: ['de la rosa', 'DE LA ROSA', 'de la Rosa'],
	},
	{
		expected: 'A.J. Styles',
		inputs: ['a.j. styles', 'A.J. STYLES', 'A.J. Styles'],
	},
	{
		expected: 'St. John',
		inputs: ['st. john', 'ST. JOHN', 'St. John'],
	},
	{
		expected: "l'Ouverture",
		inputs: ["l'ouverture", "L'OUVERTURE", 'L’Ouverture'],
	},
	{
		expected: "Jean d'Amico",
		inputs: ["jean d'amico", "JEAN D'AMICO", 'Jean D’Amico'],
	},
	{
		expected: "St. O'Brien",
		inputs: ["st o'brien", "ST O'BRIEN", 'St O’Brien'],
	},
	{
		expected: 'A.B. van Der Merwe',
		inputs: ['a.b. van der merwe', 'A.B. VAN DER MERWE', 'A.B. van der merwe'],
	},
	{
		expected: 'João da Silva III',
		inputs: ['joão da silva iii', 'JOÃO DA SILVA III', 'João da Silva iii'],
	},
	{
		expected: 'María de la Cruz',
		inputs: ['maría de la cruz', 'MARÍA DE LA CRUZ', 'María de la Cruz'],
	},
	{
		expected: "'Neheng Mants'ebo",
		inputs: ["'neheng mants'ebo", "'NEHENG MANTS'EBO", "'Neheng Mants'Ebo"],
	},
	{
		expected: 'X Æa-12',
		inputs: ['x æa-12', 'X ÆA-12', 'x Æa-12'],
	},
];

export function buildCanonicalSesothoNames() {
	const fullNames: string[] = [];
	for (const given of sesothoGivenNames) {
		for (const surname of sesothoSurnames) {
			fullNames.push(`${given.title} ${surname.title}`);
		}
	}
	return fullNames;
}

export function buildSesothoInputVariants(
	given: NameCaseVariant,
	surname: NameCaseVariant
) {
	const canonical = `${given.title} ${surname.title}`;
	const lower = `${given.lower} ${surname.lower}`;
	const upper = `${given.upper} ${surname.upper}`;
	const mixed = `${given.title} ${surname.upper}`;
	const upperRightQuote = withApostropheVariant(upper, '\u2019');
	const upperLeftQuote = withApostropheVariant(upper, '\u2018');
	const upperModifierQuote = withApostropheVariant(upper, '\u02BC');
	const upperBacktick = withApostropheVariant(upper, '`');
	const upperAcute = withApostropheVariant(upper, '\u00B4');
	return [
		canonical,
		lower,
		upper,
		mixed,
		upperRightQuote,
		upperLeftQuote,
		upperModifierQuote,
		upperBacktick,
		upperAcute,
		simulateLegacyDistortion(upper),
		`${given.title}\t${surname.upper}`,
		`  ${upper}   `,
	];
}
