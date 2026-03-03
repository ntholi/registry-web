import { describe, expect, it } from 'vitest';
import {
	repairLegacyDistortedPersonName,
	repairLegacyDistortedWordPart,
} from './person-name-distortion-repair';

describe('repairLegacyDistortedWordPart', () => {
	it('repairs apostrophe-middle distortion', () => {
		const result = repairLegacyDistortedWordPart("Ts'Ele");
		expect(result.repairedPart).toBe("Ts'ele");
		expect(result.rules.apostropheMiddle).toBe(1);
	});

	it('repairs leading-apostrophe distortion', () => {
		const result = repairLegacyDistortedWordPart("'Neheng");
		expect(result.repairedPart).toBe("'Neheng");
		expect(result.rules.apostropheLeading).toBe(1);
	});

	it('normalizes unicode apostrophes and lowercases suffix', () => {
		const result = repairLegacyDistortedWordPart('Nts’EBO');
		expect(result.repairedPart).toBe("Nts'ebo");
		expect(result.rules.apostropheUnicode).toBe(1);
		expect(result.rules.apostropheMiddle).toBe(1);
	});

	it('repairs legacy mac variant while preserving intentional forms', () => {
		const repaired = repairLegacyDistortedWordPart('MaCHeli');
		expect(repaired.repairedPart).toBe('Macheli');
		expect(repaired.rules.legacyMacVariant).toBe(1);

		const intentional = repairLegacyDistortedWordPart('macdonald');
		expect(intentional.repairedPart).toBe('MacDonald');
		expect(intentional.rules.legacyMacVariant).toBe(1);
	});

	it('leaves clean values unchanged', () => {
		const result = repairLegacyDistortedWordPart('Mokoena');
		expect(result.changed).toBe(false);
		expect(result.repairedPart).toBe('Mokoena');
	});
});

describe('repairLegacyDistortedPersonName', () => {
	it('returns undefined for nullable or blank values', () => {
		expect(repairLegacyDistortedPersonName(undefined)).toBeUndefined();
		expect(repairLegacyDistortedPersonName(null)).toBeUndefined();
		expect(repairLegacyDistortedPersonName('   ')).toBeUndefined();
	});

	it('repairs multiple distortions while preserving spacing and hyphen separators', () => {
		const value = 'Nts’EBO   Mants’O-LETS’OLO';
		const result = repairLegacyDistortedPersonName(value);
		expect(result?.repairedName).toBe("Nts'ebo   Mants'o-Lets'olo");
		expect(result?.rules.apostropheUnicode).toBe(3);
		expect(result?.rules.apostropheMiddle).toBe(3);
	});

	it('handles mixed sentence distortions with minimal collateral change', () => {
		const value = "Ts'Ele Mants'O O’Connor 'Neheng MaCHeli";
		const result = repairLegacyDistortedPersonName(value);
		expect(result?.repairedName).toBe(
			"Ts'ele Mants'o O'Connor 'Neheng Macheli"
		);
		expect(result?.changed).toBe(true);
		expect(result?.rules.apostropheMiddle).toBe(2);
		expect(result?.rules.apostropheLeading).toBe(1);
		expect(result?.rules.apostropheUnicode).toBe(1);
		expect(result?.rules.legacyMacVariant).toBe(1);
	});
});
