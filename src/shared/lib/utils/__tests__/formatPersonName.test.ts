import { describe, expect, it } from 'vitest';
import { formatPersonName, repairDistortedPersonName } from '../names';

function capitalize(part: string) {
	if (!part) return '';
	const lower = part.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toOldDistortedPart(part: string) {
	const lower = part.toLowerCase();
	if (lower.includes("'")) {
		const sections = lower.split("'");
		return sections
			.map((section, idx) => {
				if (!section) return section;
				if (idx > 0 && (sections[0]?.length ?? 0) < 3) {
					return capitalize(section);
				}
				if (idx > 0) return section.toLowerCase();
				return capitalize(section);
			})
			.join("'");
	}
	return capitalize(lower);
}

function toOldDistortedName(name: string) {
	return name
		.trim()
		.replace(/\s+/g, ' ')
		.toLowerCase()
		.split(' ')
		.map((word) =>
			word
				.split('-')
				.map((part) => toOldDistortedPart(part))
				.join('-')
		)
		.join(' ');
}

const sesothoGivenNames = [
	"Ts'ele",
	"Nts'ebo",
	"Mants'ebo",
	'Neo',
	'Lerato',
	'Mpho',
	'Lineo',
	'Puseletso',
	'Pontso',
	'Boitumelo',
	'Khotso',
	'Lesego',
	'Mosa',
	'Thabo',
	'Mamorena',
	'Teboho',
	'Limpho',
	'Puleng',
	'Nthabiseng',
	'Molemo',
	'Keneuoe',
	'Mantsopa',
	'Nteboheleng',
	'Mokete',
	'Mokhosi',
	'Molefi',
	'Masechaba',
	'Neo-Lerato',
	'Mpho-Lerato',
];

const sesothoSurnames = [
	'Macheli',
	'Machesa',
	'Machobane',
	'Machaka',
	'Machobisa',
	'Machache',
	'Makoa',
	'Makoanyane',
	'Mokhethi',
	'Mokone',
	'Mofokeng',
	'Moleleki',
	"Mo'letsane",
	'Mohlomi',
	'Motsamai',
	'Ramathe',
	'Rantlo',
	'Rasethuntsha',
	'Phafoli',
	'Qhobela',
];

const generatedSesothoNames: string[] = [];
for (const firstName of sesothoGivenNames) {
	for (const surname of sesothoSurnames) {
		generatedSesothoNames.push(`${firstName} ${surname}`);
	}
}

describe('formatPersonName', () => {
	it('normalizes uppercase names with apostrophes', () => {
		expect(formatPersonName("NTS'EBO LEBESE")).toBe("Nts'ebo Lebese");
	});

	it('normalizes mixed case names with apostrophes', () => {
		expect(formatPersonName("Nts'Ebo Lebese")).toBe("Nts'ebo Lebese");
	});

	it('normalizes hyphenated names and extra spaces', () => {
		expect(formatPersonName('  NEO-LERATO   KHETHA ')).toBe(
			'Neo-Lerato Khetha'
		);
	});

	it('returns nullable inputs unchanged', () => {
		expect(formatPersonName(undefined)).toBeUndefined();
		expect(formatPersonName(null)).toBeUndefined();
		expect(formatPersonName('   ')).toBeUndefined();
	});

	it('preserves complex person-name patterns', () => {
		expect(formatPersonName("O'Connor")).toBe("O'Connor");
		expect(formatPersonName('McDonald')).toBe('McDonald');
		expect(formatPersonName('von Goethe')).toBe('von Goethe');
		expect(formatPersonName('de la Rosa')).toBe('de la Rosa');
		expect(formatPersonName('van Gogh')).toBe('van Gogh');
		expect(formatPersonName('MacIntyre')).toBe('MacIntyre');
		expect(formatPersonName('King James iii')).toBe('King James III');
		expect(formatPersonName('a.j. styles')).toBe('A.J. Styles');
		expect(formatPersonName('aj styles')).toBe('Aj Styles');
		expect(formatPersonName("d'artagnan")).toBe("d'Artagnan");
		expect(formatPersonName('al-fayed')).toBe('al-Fayed');
		expect(formatPersonName('st. john')).toBe('St. John');
		expect(formatPersonName('Leonardo da Vinci')).toBe('Leonardo da Vinci');
	});

	it('repairs known old-distortion patterns', () => {
		expect(repairDistortedPersonName("Ts'Ele Peter MacHeli")).toBe(
			"Ts'ele Peter MacHeli"
		);
		expect(formatPersonName("Ts'Ele Peter Macheli")).toBe(
			"Ts'ele Peter Macheli"
		);
		expect(formatPersonName("Nts'Ebo Mants'O")).toBe("Nts'ebo Mants'o");
	});

	it('normalizes large auto-generated Sesotho name variations safely', () => {
		for (const canonicalName of generatedSesothoNames) {
			const variants = [
				canonicalName.toUpperCase(),
				canonicalName.toLowerCase(),
				toOldDistortedName(canonicalName),
				`  ${canonicalName.toUpperCase()}   `,
			];

			for (const variant of variants) {
				expect(formatPersonName(variant)).toBe(canonicalName);
			}
		}
	});
});
