import { describe, expect, it } from 'vitest';
import { formatPersonName } from '../names';

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
});
