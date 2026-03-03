import { describe, expect, it } from 'vitest';
import {
	type DistortionRuleCounts,
	mergeRuleCounts,
	repairLegacyDistortedPersonName,
	repairLegacyDistortedWordPart,
} from './person-name-distortion-repair';

describe('repairLegacyDistortedWordPart', () => {
	describe('empty / no-op inputs', () => {
		it('returns empty string unchanged', () => {
			const r = repairLegacyDistortedWordPart('');
			expect(r.repairedPart).toBe('');
			expect(r.changed).toBe(false);
		});

		it('leaves a simple clean name unchanged', () => {
			const r = repairLegacyDistortedWordPart('Mokoena');
			expect(r.repairedPart).toBe('Mokoena');
			expect(r.changed).toBe(false);
		});

		it('leaves an all-lowercase single word unchanged', () => {
			const r = repairLegacyDistortedWordPart('john');
			expect(r.repairedPart).toBe('john');
			expect(r.changed).toBe(false);
		});

		it('leaves an all-uppercase single word unchanged', () => {
			const r = repairLegacyDistortedWordPart('JOHN');
			expect(r.repairedPart).toBe('JOHN');
			expect(r.changed).toBe(false);
		});

		it('leaves a single character unchanged', () => {
			const r = repairLegacyDistortedWordPart('A');
			expect(r.repairedPart).toBe('A');
			expect(r.changed).toBe(false);
		});

		it('leaves a properly formatted name unchanged', () => {
			const r = repairLegacyDistortedWordPart('Smith');
			expect(r.repairedPart).toBe('Smith');
			expect(r.changed).toBe(false);
		});

		it('leaves a numeric string unchanged', () => {
			const r = repairLegacyDistortedWordPart('123');
			expect(r.repairedPart).toBe('123');
			expect(r.changed).toBe(false);
		});
	});

	describe('apostropheMiddle distortion', () => {
		it("repairs Ts'Ele \u2192 Ts'ele", () => {
			const r = repairLegacyDistortedWordPart("Ts'Ele");
			expect(r.repairedPart).toBe("Ts'ele");
			expect(r.rules.apostropheMiddle).toBe(1);
			expect(r.changed).toBe(true);
		});

		it("repairs Mants'O \u2192 Mants'o", () => {
			const r = repairLegacyDistortedWordPart("Mants'O");
			expect(r.repairedPart).toBe("Mants'o");
			expect(r.rules.apostropheMiddle).toBe(1);
		});

		it("repairs MA'LEBO \u2192 Ma'lebo", () => {
			const r = repairLegacyDistortedWordPart("MA'LEBO");
			expect(r.repairedPart).toBe("Ma'lebo");
			expect(r.rules.apostropheMiddle).toBe(1);
		});

		it("repairs Nts'EBO \u2192 Nts'ebo", () => {
			const r = repairLegacyDistortedWordPart("Nts'EBO");
			expect(r.repairedPart).toBe("Nts'ebo");
			expect(r.rules.apostropheMiddle).toBe(1);
		});

		it("repairs Lets'OLO \u2192 Lets'olo", () => {
			const r = repairLegacyDistortedWordPart("Lets'OLO");
			expect(r.repairedPart).toBe("Lets'olo");
			expect(r.rules.apostropheMiddle).toBe(1);
		});

		it("repairs MOTS'EARE \u2192 Mots'eare", () => {
			const r = repairLegacyDistortedWordPart("MOTS'EARE");
			expect(r.repairedPart).toBe("Mots'eare");
			expect(r.rules.apostropheMiddle).toBe(1);
		});

		it("does not match single-char prefix like O'Brien (only 1 char before ')", () => {
			const r = repairLegacyDistortedWordPart("O'Brien");
			expect(r.repairedPart).toBe("O'Brien");
			expect(r.rules.apostropheMiddle).toBe(0);
			expect(r.changed).toBe(false);
		});

		it("does not match O'Connor (single char prefix)", () => {
			const r = repairLegacyDistortedWordPart("O'Connor");
			expect(r.repairedPart).toBe("O'Connor");
			expect(r.rules.apostropheMiddle).toBe(0);
		});

		it("does not match properly lowercased suffix like Ts'ele", () => {
			const r = repairLegacyDistortedWordPart("Ts'ele");
			expect(r.repairedPart).toBe("Ts'ele");
			expect(r.rules.apostropheMiddle).toBe(0);
			expect(r.changed).toBe(false);
		});

		it("does not match when suffix starts lowercase like se'tho", () => {
			const r = repairLegacyDistortedWordPart("se'tho");
			expect(r.repairedPart).toBe("se'tho");
			expect(r.rules.apostropheMiddle).toBe(0);
		});
	});

	describe('apostropheLeading distortion', () => {
		it("keeps 'Neheng as-is (already correct capitalization)", () => {
			const r = repairLegacyDistortedWordPart("'Neheng");
			expect(r.repairedPart).toBe("'Neheng");
			expect(r.rules.apostropheLeading).toBe(1);
		});

		it("repairs 'NEHENG \u2192 'Neheng", () => {
			const r = repairLegacyDistortedWordPart("'NEHENG");
			expect(r.repairedPart).toBe("'Neheng");
			expect(r.rules.apostropheLeading).toBe(1);
			expect(r.changed).toBe(true);
		});

		it("repairs 'MUSO \u2192 'Muso", () => {
			const r = repairLegacyDistortedWordPart("'MUSO");
			expect(r.repairedPart).toBe("'Muso");
			expect(r.rules.apostropheLeading).toBe(1);
		});

		it("repairs 'N \u2192 'N (single uppercase char after apostrophe)", () => {
			const r = repairLegacyDistortedWordPart("'N");
			expect(r.repairedPart).toBe("'N");
			expect(r.rules.apostropheLeading).toBe(1);
		});

		it("does not match 'neheng (lowercase after apostrophe)", () => {
			const r = repairLegacyDistortedWordPart("'neheng");
			expect(r.repairedPart).toBe("'neheng");
			expect(r.rules.apostropheLeading).toBe(0);
		});

		it("does not match '123 (non-alpha after apostrophe)", () => {
			const r = repairLegacyDistortedWordPart("'123");
			expect(r.repairedPart).toBe("'123");
			expect(r.rules.apostropheLeading).toBe(0);
		});
	});

	describe('apostropheUnicode normalization', () => {
		it('normalizes left single quotation mark \u2018', () => {
			const r = repairLegacyDistortedWordPart('\u2018Neheng');
			expect(r.repairedPart).toContain("'");
			expect(r.repairedPart).not.toContain('\u2018');
			expect(r.rules.apostropheUnicode).toBe(1);
		});

		it('normalizes right single quotation mark \u2019', () => {
			const r = repairLegacyDistortedWordPart('Nts\u2019EBO');
			expect(r.repairedPart).toBe("Nts'ebo");
			expect(r.rules.apostropheUnicode).toBe(1);
			expect(r.rules.apostropheMiddle).toBe(1);
		});

		it('normalizes modifier letter apostrophe \u02BC', () => {
			const r = repairLegacyDistortedWordPart('Ts\u02BCEle');
			expect(r.repairedPart).toBe("Ts'ele");
			expect(r.rules.apostropheUnicode).toBe(1);
		});

		it('normalizes backtick \u0060', () => {
			const r = repairLegacyDistortedWordPart('Ts\u0060Ele');
			expect(r.repairedPart).toBe("Ts'ele");
			expect(r.rules.apostropheUnicode).toBe(1);
		});

		it('normalizes acute accent \u00B4', () => {
			const r = repairLegacyDistortedWordPart('Ts\u00B4Ele');
			expect(r.repairedPart).toBe("Ts'ele");
			expect(r.rules.apostropheUnicode).toBe(1);
		});

		it('counts multiple unicode apostrophes in one word', () => {
			const r = repairLegacyDistortedWordPart('a\u2018b\u2019c');
			expect(r.repairedPart).toContain("'");
			expect(r.rules.apostropheUnicode).toBe(2);
		});

		it('does not count standard ASCII apostrophe as unicode', () => {
			const r = repairLegacyDistortedWordPart("Ts'ele");
			expect(r.rules.apostropheUnicode).toBe(0);
		});
	});

	describe('legacyMacVariant distortion', () => {
		describe('known intentional Mac surnames (whitelist)', () => {
			const knownSurnames = [
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
			];

			for (const surname of knownSurnames) {
				it(`preserves correctly cased ${surname}`, () => {
					const r = repairLegacyDistortedWordPart(surname);
					expect(r.repairedPart).toBe(surname);
					expect(r.changed).toBe(false);
				});
			}

			it('restores MacDonald from all-lowercase macdonald', () => {
				const r = repairLegacyDistortedWordPart('macdonald');
				expect(r.repairedPart).toBe('MacDonald');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('restores MacKenzie from all-lowercase mackenzie', () => {
				const r = repairLegacyDistortedWordPart('mackenzie');
				expect(r.repairedPart).toBe('MacKenzie');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('restores MacPherson from MACPHERSON', () => {
				const r = repairLegacyDistortedWordPart('MACPHERSON');
				expect(r.repairedPart).toBe('MacPherson');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('restores MacDonald from MACDONALD', () => {
				const r = repairLegacyDistortedWordPart('MACDONALD');
				expect(r.repairedPart).toBe('MacDonald');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('restores MacLeod from macleod', () => {
				const r = repairLegacyDistortedWordPart('macleod');
				expect(r.repairedPart).toBe('MacLeod');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('restores MacMillan from MACMILLAN', () => {
				const r = repairLegacyDistortedWordPart('MACMILLAN');
				expect(r.repairedPart).toBe('MacMillan');
				expect(r.rules.legacyMacVariant).toBe(1);
			});
		});

		describe('distorted Mac patterns (non-whitelisted)', () => {
			it('repairs MaCHeli \u2192 Macheli', () => {
				const r = repairLegacyDistortedWordPart('MaCHeli');
				expect(r.repairedPart).toBe('Macheli');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('repairs MacHeli \u2192 Macheli (Mac + uppercase start)', () => {
				const r = repairLegacyDistortedWordPart('MacHeli');
				expect(r.repairedPart).toBe('Macheli');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('repairs mAcHeli \u2192 Macheli', () => {
				const r = repairLegacyDistortedWordPart('mAcHeli');
				expect(r.repairedPart).toBe('Macheli');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('repairs macHeli \u2192 Macheli', () => {
				const r = repairLegacyDistortedWordPart('macHeli');
				expect(r.repairedPart).toBe('Macheli');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('repairs MacTsolo \u2192 Mactsolo', () => {
				const r = repairLegacyDistortedWordPart('MacTsolo');
				expect(r.repairedPart).toBe('Mactsolo');
				expect(r.rules.legacyMacVariant).toBe(1);
			});

			it('repairs MaCLephole \u2192 Maclephole', () => {
				const r = repairLegacyDistortedWordPart('MaCLephole');
				expect(r.repairedPart).toBe('Maclephole');
				expect(r.rules.legacyMacVariant).toBe(1);
			});
		});

		describe('non-Mac words left unchanged', () => {
			it('leaves Machine unchanged', () => {
				const r = repairLegacyDistortedWordPart('Machine');
				expect(r.repairedPart).toBe('Machine');
				expect(r.rules.legacyMacVariant).toBe(0);
			});

			it('leaves Macro unchanged', () => {
				const r = repairLegacyDistortedWordPart('Macro');
				expect(r.repairedPart).toBe('Macro');
				expect(r.rules.legacyMacVariant).toBe(0);
			});

			it('leaves Mace unchanged', () => {
				const r = repairLegacyDistortedWordPart('Mace');
				expect(r.repairedPart).toBe('Mace');
				expect(r.rules.legacyMacVariant).toBe(0);
			});

			it('leaves Mac unchanged (too short, no uppercase after)', () => {
				const r = repairLegacyDistortedWordPart('Mac');
				expect(r.repairedPart).toBe('Mac');
				expect(r.rules.legacyMacVariant).toBe(0);
			});
		});
	});

	describe('combined distortions on a single word', () => {
		it('handles unicode apostrophe + middle distortion together', () => {
			const r = repairLegacyDistortedWordPart('Nts\u2019EBO');
			expect(r.repairedPart).toBe("Nts'ebo");
			expect(r.rules.apostropheUnicode).toBe(1);
			expect(r.rules.apostropheMiddle).toBe(1);
			expect(r.changed).toBe(true);
		});

		it('handles unicode apostrophe + leading distortion', () => {
			const r = repairLegacyDistortedWordPart('\u2019NEHENG');
			expect(r.repairedPart).toBe("'Neheng");
			expect(r.rules.apostropheUnicode).toBe(1);
			expect(r.rules.apostropheLeading).toBe(1);
		});

		it('unicode normalization alone without other rules', () => {
			const r = repairLegacyDistortedWordPart('Ts\u2019ele');
			expect(r.repairedPart).toBe("Ts'ele");
			expect(r.rules.apostropheUnicode).toBe(1);
			expect(r.rules.apostropheMiddle).toBe(0);
			expect(r.rules.apostropheLeading).toBe(0);
		});
	});
});

describe('repairLegacyDistortedPersonName', () => {
	describe('null / undefined / blank handling', () => {
		it('returns undefined for undefined', () => {
			expect(repairLegacyDistortedPersonName(undefined)).toBeUndefined();
		});

		it('returns undefined for null', () => {
			expect(repairLegacyDistortedPersonName(null)).toBeUndefined();
		});

		it('returns undefined for empty string', () => {
			expect(repairLegacyDistortedPersonName('')).toBeUndefined();
		});

		it('returns undefined for whitespace-only string', () => {
			expect(repairLegacyDistortedPersonName('   ')).toBeUndefined();
		});

		it('returns undefined for tab-only string', () => {
			expect(repairLegacyDistortedPersonName('\t\t')).toBeUndefined();
		});
	});

	describe('no-change scenarios', () => {
		it('reports changed=false for a clean simple name', () => {
			const r = repairLegacyDistortedPersonName('John Smith');
			expect(r?.changed).toBe(false);
			expect(r?.repairedName).toBe('John Smith');
		});

		it('reports changed=false for a clean hyphenated name', () => {
			const r = repairLegacyDistortedPersonName('Mary-Jane Watson');
			expect(r?.changed).toBe(false);
			expect(r?.repairedName).toBe('Mary-Jane Watson');
		});

		it("reports changed=false for clean O'Brien style name", () => {
			const r = repairLegacyDistortedPersonName("Sean O'Brien");
			expect(r?.changed).toBe(false);
			expect(r?.repairedName).toBe("Sean O'Brien");
		});

		it('reports changed=false for all-uppercase name (no Mac or apostrophe)', () => {
			const r = repairLegacyDistortedPersonName('JOHN SMITH');
			expect(r?.changed).toBe(false);
			expect(r?.repairedName).toBe('JOHN SMITH');
		});

		it('reports changed=false for all-lowercase name (no Mac or apostrophe)', () => {
			const r = repairLegacyDistortedPersonName('john smith');
			expect(r?.changed).toBe(false);
			expect(r?.repairedName).toBe('john smith');
		});
	});

	describe('whitespace and separator preservation', () => {
		it('preserves multiple spaces between words', () => {
			const r = repairLegacyDistortedPersonName("Ts'Ele   Mokoena");
			expect(r?.repairedName).toBe("Ts'ele   Mokoena");
		});

		it('preserves leading and trailing spaces in joined output', () => {
			const r = repairLegacyDistortedPersonName("  Ts'Ele  ");
			expect(r?.repairedName).toBe("  Ts'ele  ");
		});

		it('preserves hyphens between distorted parts', () => {
			const r = repairLegacyDistortedPersonName("Mants'O-Lets'OLO");
			expect(r?.repairedName).toBe("Mants'o-Lets'olo");
		});

		it('preserves mixed hyphens and spaces', () => {
			const r = repairLegacyDistortedPersonName(
				"Nts'EBO Mants'O-Lets'OLO Smith"
			);
			expect(r?.repairedName).toBe("Nts'ebo Mants'o-Lets'olo Smith");
		});
	});

	describe('full name apostrophe-middle repairs', () => {
		it("repairs full name: Nts'EBO Mokoena", () => {
			const r = repairLegacyDistortedPersonName("Nts'EBO Mokoena");
			expect(r?.repairedName).toBe("Nts'ebo Mokoena");
			expect(r?.rules.apostropheMiddle).toBe(1);
		});

		it('repairs multiple apostrophe-middle in one name', () => {
			const r = repairLegacyDistortedPersonName("Ts'Ele Mants'O");
			expect(r?.repairedName).toBe("Ts'ele Mants'o");
			expect(r?.rules.apostropheMiddle).toBe(2);
		});

		it("repairs Rethabile Ma'LEBO", () => {
			const r = repairLegacyDistortedPersonName("Rethabile Ma'LEBO");
			expect(r?.repairedName).toBe("Rethabile Ma'lebo");
			expect(r?.rules.apostropheMiddle).toBe(1);
		});
	});

	describe('full name apostrophe-leading repairs', () => {
		it("repairs leading apostrophe: 'MUSO Thabang", () => {
			const r = repairLegacyDistortedPersonName("'MUSO Thabang");
			expect(r?.repairedName).toBe("'Muso Thabang");
			expect(r?.rules.apostropheLeading).toBe(1);
		});
	});

	describe('full name unicode apostrophe repairs', () => {
		it('normalizes unicode apostrophes across full name', () => {
			const value = 'Nts\u2019EBO Mants\u2019O-Lets\u2019OLO';
			const r = repairLegacyDistortedPersonName(value);
			expect(r?.repairedName).toBe("Nts'ebo Mants'o-Lets'olo");
			expect(r?.rules.apostropheUnicode).toBe(3);
			expect(r?.rules.apostropheMiddle).toBe(3);
		});
	});

	describe('full name Mac variant repairs', () => {
		it('repairs MaCHeli in full name', () => {
			const r = repairLegacyDistortedPersonName('Thabo MaCHeli');
			expect(r?.repairedName).toBe('Thabo Macheli');
			expect(r?.rules.legacyMacVariant).toBe(1);
		});

		it('preserves known MacDonald in full name', () => {
			const r = repairLegacyDistortedPersonName('macdonald John');
			expect(r?.repairedName).toBe('MacDonald John');
			expect(r?.rules.legacyMacVariant).toBe(1);
		});

		it('repairs multiple Mac distortions', () => {
			const r = repairLegacyDistortedPersonName('MaCHeli macHeli');
			expect(r?.repairedName).toBe('Macheli Macheli');
			expect(r?.rules.legacyMacVariant).toBe(2);
		});
	});

	describe('mixed distortion types in full names', () => {
		it('handles all 4 distortion types in one name', () => {
			const value = "Ts'Ele Mants\u2019O O'Connor 'NEHENG MaCHeli";
			const r = repairLegacyDistortedPersonName(value);
			expect(r?.repairedName).toBe("Ts'ele Mants'o O'Connor 'Neheng Macheli");
			expect(r?.changed).toBe(true);
			expect(r?.rules.apostropheMiddle).toBe(2);
			expect(r?.rules.apostropheLeading).toBe(1);
			expect(r?.rules.apostropheUnicode).toBe(1);
			expect(r?.rules.legacyMacVariant).toBe(1);
		});

		it('handles the original test case with preserved spacing', () => {
			const value = 'Nts\u2019EBO   Mants\u2019O-Lets\u2019OLO';
			const r = repairLegacyDistortedPersonName(value);
			expect(r?.repairedName).toBe("Nts'ebo   Mants'o-Lets'olo");
			expect(r?.rules.apostropheUnicode).toBe(3);
			expect(r?.rules.apostropheMiddle).toBe(3);
		});

		it("handles Ts'Ele Mants'O O'Connor 'Neheng MaCHeli with correct rule counts", () => {
			const value = "Ts'Ele Mants'O O'Connor 'Neheng MaCHeli";
			const r = repairLegacyDistortedPersonName(value);
			expect(r?.repairedName).toBe("Ts'ele Mants'o O'Connor 'Neheng Macheli");
			expect(r?.changed).toBe(true);
			expect(r?.rules.apostropheMiddle).toBe(2);
			expect(r?.rules.apostropheLeading).toBe(1);
			expect(r?.rules.legacyMacVariant).toBe(1);
		});
	});

	describe('realistic Sesotho / Southern African name distortions', () => {
		it("repairs Mots'eare from MOTS'EARE", () => {
			const r = repairLegacyDistortedPersonName("MOTS'EARE Lerato");
			expect(r?.repairedName).toBe("Mots'eare Lerato");
		});

		it("repairs Lets'olo from Lets'OLO", () => {
			const r = repairLegacyDistortedPersonName("Thabo Lets'OLO");
			expect(r?.repairedName).toBe("Thabo Lets'olo");
		});

		it("repairs Ts'epo from Ts'EPO", () => {
			const r = repairLegacyDistortedPersonName("Ts'EPO Mokoena");
			expect(r?.repairedName).toBe("Ts'epo Mokoena");
		});

		it("repairs Nts'ebo from unicode Nts\u2019EBO", () => {
			const r = repairLegacyDistortedPersonName('Nts\u2019EBO Phiri');
			expect(r?.repairedName).toBe("Nts'ebo Phiri");
		});

		it("repairs full Sesotho name: Ts'Ele Mants'O-Lets'OLO", () => {
			const r = repairLegacyDistortedPersonName("Ts'Ele Mants'O-Lets'OLO");
			expect(r?.repairedName).toBe("Ts'ele Mants'o-Lets'olo");
		});

		it("handles 'Nyane from 'NYANE", () => {
			const r = repairLegacyDistortedPersonName("Mpho 'NYANE");
			expect(r?.repairedName).toBe("Mpho 'Nyane");
		});

		it("handles Se'ntle from SE'NTLE", () => {
			const r = repairLegacyDistortedPersonName("SE'NTLE Thabang");
			expect(r?.repairedName).toBe("Se'ntle Thabang");
		});
	});

	describe('edge cases', () => {
		it('handles a single-word distorted name', () => {
			const r = repairLegacyDistortedPersonName("Ts'Ele");
			expect(r?.repairedName).toBe("Ts'ele");
			expect(r?.changed).toBe(true);
		});

		it('handles a name that is just an apostrophe', () => {
			const r = repairLegacyDistortedPersonName("'");
			expect(r?.repairedName).toBe("'");
			expect(r?.changed).toBe(false);
		});

		it('handles name with only hyphens', () => {
			const r = repairLegacyDistortedPersonName('---');
			expect(r?.repairedName).toBe('---');
			expect(r?.changed).toBe(false);
		});

		it('handles very long name with multiple distortions', () => {
			const value =
				"Nts\u2019EBO Mants\u2019O-Lets\u2019OLO Ts'Ele 'MUSO MaCHeli MacDonald";
			const r = repairLegacyDistortedPersonName(value);
			expect(r?.repairedName).toBe(
				"Nts'ebo Mants'o-Lets'olo Ts'ele 'Muso Macheli MacDonald"
			);
			expect(r?.changed).toBe(true);
		});

		it('returns changed=false and correct name when no distortion present', () => {
			const r = repairLegacyDistortedPersonName('Thabang Mokoena Phiri Lerato');
			expect(r?.changed).toBe(false);
			expect(r?.repairedName).toBe('Thabang Mokoena Phiri Lerato');
		});
	});
});

describe('mergeRuleCounts', () => {
	it('merges source counts into target', () => {
		const target: DistortionRuleCounts = {
			apostropheMiddle: 1,
			apostropheLeading: 0,
			apostropheUnicode: 2,
			legacyMacVariant: 0,
		};
		const source: DistortionRuleCounts = {
			apostropheMiddle: 3,
			apostropheLeading: 1,
			apostropheUnicode: 0,
			legacyMacVariant: 2,
		};
		mergeRuleCounts(target, source);
		expect(target).toEqual({
			apostropheMiddle: 4,
			apostropheLeading: 1,
			apostropheUnicode: 2,
			legacyMacVariant: 2,
		});
	});

	it('handles merging zeros', () => {
		const target: DistortionRuleCounts = {
			apostropheMiddle: 0,
			apostropheLeading: 0,
			apostropheUnicode: 0,
			legacyMacVariant: 0,
		};
		const source: DistortionRuleCounts = {
			apostropheMiddle: 0,
			apostropheLeading: 0,
			apostropheUnicode: 0,
			legacyMacVariant: 0,
		};
		mergeRuleCounts(target, source);
		expect(target).toEqual({
			apostropheMiddle: 0,
			apostropheLeading: 0,
			apostropheUnicode: 0,
			legacyMacVariant: 0,
		});
	});

	it('accumulates over multiple merges', () => {
		const target: DistortionRuleCounts = {
			apostropheMiddle: 0,
			apostropheLeading: 0,
			apostropheUnicode: 0,
			legacyMacVariant: 0,
		};
		mergeRuleCounts(target, {
			apostropheMiddle: 2,
			apostropheLeading: 1,
			apostropheUnicode: 0,
			legacyMacVariant: 0,
		});
		mergeRuleCounts(target, {
			apostropheMiddle: 1,
			apostropheLeading: 0,
			apostropheUnicode: 3,
			legacyMacVariant: 1,
		});
		expect(target).toEqual({
			apostropheMiddle: 3,
			apostropheLeading: 1,
			apostropheUnicode: 3,
			legacyMacVariant: 1,
		});
	});
});
