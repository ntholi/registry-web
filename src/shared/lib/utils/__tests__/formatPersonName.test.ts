import { describe, expect, it } from 'vitest';
import { formatPersonName } from '../utils';

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
});
