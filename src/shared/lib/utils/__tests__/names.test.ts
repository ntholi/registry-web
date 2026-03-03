import { describe, expect, it } from 'vitest';
import {
	formatPersonName,
	repairDistortedPersonName,
} from '@/shared/lib/utils/names';

describe('formatPersonName', () => {
	describe('null / undefined / blank handling', () => {
		it('returns undefined for undefined', () => {
			expect(formatPersonName(undefined)).toBeUndefined();
		});

		it('returns undefined for null', () => {
			expect(formatPersonName(null)).toBeUndefined();
		});

		it('returns undefined for empty string', () => {
			expect(formatPersonName('')).toBeUndefined();
		});

		it('returns undefined for whitespace-only string', () => {
			expect(formatPersonName('   ')).toBeUndefined();
		});

		it('returns undefined for tab-only string', () => {
			expect(formatPersonName('\t')).toBeUndefined();
		});
	});

	describe('basic capitalization', () => {
		it('capitalizes a lowercase single name', () => {
			expect(formatPersonName('john')).toBe('John');
		});

		it('capitalizes an all-uppercase single name', () => {
			expect(formatPersonName('JOHN')).toBe('John');
		});

		it('preserves already correct title case', () => {
			expect(formatPersonName('John')).toBe('John');
		});

		it('capitalizes a full lowercase name', () => {
			expect(formatPersonName('john smith')).toBe('John Smith');
		});

		it('capitalizes a full uppercase name', () => {
			expect(formatPersonName('JOHN SMITH')).toBe('John Smith');
		});

		it('preserves mixed case full name (hasMixedCase detection)', () => {
			expect(formatPersonName('jOHN sMITH')).toBe('jOHN sMITH');
		});

		it('capitalizes multi-word name', () => {
			expect(formatPersonName('thabo mokoena phiri')).toBe(
				'Thabo Mokoena Phiri'
			);
		});
	});

	describe('whitespace normalization', () => {
		it('collapses multiple spaces between words', () => {
			expect(formatPersonName('John   Smith')).toBe('John Smith');
		});

		it('trims leading and trailing spaces', () => {
			expect(formatPersonName('  John Smith  ')).toBe('John Smith');
		});

		it('handles tabs and mixed whitespace', () => {
			expect(formatPersonName('John\t Smith')).toBe('John Smith');
		});
	});

	describe('hyphenated names', () => {
		it('capitalizes both parts of a hyphenated name', () => {
			expect(formatPersonName('mary-jane')).toBe('Mary-Jane');
		});

		it('capitalizes all-caps hyphenated name', () => {
			expect(formatPersonName('MARY-JANE WATSON')).toBe('Mary-Jane Watson');
		});

		it('handles multiple hyphens', () => {
			expect(formatPersonName('jean-claude-andre')).toBe('Jean-Claude-Andre');
		});

		it('handles hyphenated surname in full name', () => {
			expect(formatPersonName('lisa smith-jones')).toBe('Lisa Smith-Jones');
		});
	});

	describe('name particles (lowercase connectors)', () => {
		it('lowercases "de" particle', () => {
			expect(formatPersonName('MARIA DE SOUZA')).toBe('Maria de Souza');
		});

		it('lowercases "van" particle ("der" is not a recognized particle)', () => {
			expect(formatPersonName('PIETER VAN DER BERG')).toBe(
				'Pieter van Der Berg'
			);
		});

		it('lowercases "von" particle', () => {
			expect(formatPersonName('HANS VON TRAPP')).toBe('Hans von Trapp');
		});

		it('lowercases "da" particle', () => {
			expect(formatPersonName('CARLOS DA SILVA')).toBe('Carlos da Silva');
		});

		it('lowercases "du" particle', () => {
			expect(formatPersonName('JEAN DU PLESSIS')).toBe('Jean du Plessis');
		});

		it('lowercases "del" particle', () => {
			expect(formatPersonName('MARCO DEL TORO')).toBe('Marco del Toro');
		});

		it('lowercases "la" particle', () => {
			expect(formatPersonName('PIERRE LA FONTAINE')).toBe('Pierre la Fontaine');
		});

		it('lowercases "el" particle', () => {
			expect(formatPersonName('ALI EL AMIN')).toBe('Ali el Amin');
		});

		it('lowercases "bin" particle', () => {
			expect(formatPersonName('AHMAD BIN HASSAN')).toBe('Ahmad bin Hassan');
		});

		it('lowercases "ibn" particle', () => {
			expect(formatPersonName('OMAR IBN KHATTAB')).toBe('Omar ibn Khattab');
		});

		it('lowercases "dos" particle', () => {
			expect(formatPersonName('ANA DOS SANTOS')).toBe('Ana dos Santos');
		});

		it('lowercases "le" particle', () => {
			expect(formatPersonName('PIERRE LE BLANC')).toBe('Pierre le Blanc');
		});

		it('lowercases "di" particle', () => {
			expect(formatPersonName('MARCO DI CAPRIO')).toBe('Marco di Caprio');
		});

		it('lowercases "do" particle', () => {
			expect(formatPersonName('JOAO DO NASCIMENTO')).toBe('Joao do Nascimento');
		});

		it('lowercases "das" particle', () => {
			expect(formatPersonName('MARIA DAS NEVES')).toBe('Maria das Neves');
		});

		it('lowercases "della" particle', () => {
			expect(formatPersonName('MARIA DELLA ROVERE')).toBe('Maria della Rovere');
		});

		it('lowercases "al" particle', () => {
			expect(formatPersonName('AHMED AL RASHID')).toBe('Ahmed al Rashid');
		});
	});

	describe('apostrophe names', () => {
		it("preserves O'Brien pattern (single char prefix)", () => {
			expect(formatPersonName("O'BRIEN")).toBe("O'Brien");
		});

		it("preserves O'Connor pattern", () => {
			expect(formatPersonName("O'CONNOR")).toBe("O'Connor");
		});

		it("handles D'Angelo (lowercase d' prefix)", () => {
			expect(formatPersonName("D'ANGELO")).toBe("d'Angelo");
		});

		it("handles L'Oreal style (lowercase l' prefix)", () => {
			expect(formatPersonName("L'AMOUR")).toBe("l'Amour");
		});

		it("handles Sesotho apostrophe names like Ts'ele", () => {
			expect(formatPersonName("TS'ELE")).toBe("Ts'ele");
		});

		it("handles Nts'ebo", () => {
			expect(formatPersonName("NTS'EBO")).toBe("Nts'ebo");
		});

		it("handles Mants'o", () => {
			expect(formatPersonName("MANTS'O")).toBe("Mants'o");
		});
		it('handles names with special characters', () => {
			expect(formatPersonName('Mantoetsi Portia `neko')).toBe(
				"Mantoetsi Portia 'Neko"
			);
		});
	});

	describe('unicode apostrophe normalization', () => {
		it('normalizes right single quotation mark \u2019', () => {
			expect(formatPersonName('Ts\u2019ele')).toBe("Ts'ele");
		});

		it('normalizes left single quotation mark \u2018', () => {
			expect(formatPersonName('Ts\u2018ele')).toBe("Ts'ele");
		});

		it('normalizes modifier letter apostrophe \u02BC', () => {
			expect(formatPersonName('Ts\u02BCele')).toBe("Ts'ele");
		});

		it('normalizes backtick \u0060', () => {
			expect(formatPersonName('Ts\u0060ele')).toBe("Ts'ele");
		});

		it('normalizes acute accent \u00B4', () => {
			expect(formatPersonName('Ts\u00B4ele')).toBe("Ts'ele");
		});
	});

	describe('mixed case preservation', () => {
		it('preserves McDonald (mixed case)', () => {
			expect(formatPersonName('McDonald')).toBe('McDonald');
		});

		it('preserves DeVito (mixed case)', () => {
			expect(formatPersonName('DeVito')).toBe('DeVito');
		});

		it('preserves LeBron (mixed case)', () => {
			expect(formatPersonName('LeBron')).toBe('LeBron');
		});

		it('preserves McLeod (mixed case)', () => {
			expect(formatPersonName('McLeod')).toBe('McLeod');
		});
	});

	describe('Roman numerals', () => {
		it('uppercases III', () => {
			expect(formatPersonName('john smith iii')).toBe('John Smith III');
		});

		it('uppercases IV', () => {
			expect(formatPersonName('john smith iv')).toBe('John Smith IV');
		});

		it('uppercases II', () => {
			expect(formatPersonName('henry ii')).toBe('Henry II');
		});

		it('uppercases VI', () => {
			expect(formatPersonName('henry vi')).toBe('Henry VI');
		});
	});

	describe('initials', () => {
		it('uppercases J.R. initials', () => {
			expect(formatPersonName('j.r. smith')).toBe('J.R. Smith');
		});

		it('uppercases A.B. initials', () => {
			expect(formatPersonName('a.b. mokoena')).toBe('A.B. Mokoena');
		});

		it('uppercases T.S. initials', () => {
			expect(formatPersonName('t.s. eliot')).toBe('T.S. Eliot');
		});
	});

	describe('St. prefix', () => {
		it('normalizes st to St.', () => {
			expect(formatPersonName('ST JOHN')).toBe('St. John');
		});

		it('normalizes st. to St.', () => {
			expect(formatPersonName('st. john')).toBe('St. John');
		});
	});

	describe('complex real-world names', () => {
		it('handles full Sesotho name with particles and apostrophes', () => {
			expect(formatPersonName("THABO NTS'EBO MOKOENA")).toBe(
				"Thabo Nts'ebo Mokoena"
			);
		});

		it('handles European name with articles', () => {
			expect(formatPersonName('MARIA DE LA CRUZ GONZALEZ')).toBe(
				'Maria de la Cruz Gonzalez'
			);
		});

		it('handles hyphenated with particles', () => {
			expect(formatPersonName('JEAN-PIERRE DE VILLIERS')).toBe(
				'Jean-Pierre de Villiers'
			);
		});

		it('handles a name with initials and particle ("der" not a particle)', () => {
			expect(formatPersonName('j.r. van der berg')).toBe('J.R. van Der Berg');
		});

		it('handles Irish name with apostrophe', () => {
			expect(formatPersonName("SEAN O'MALLEY")).toBe("Sean O'Malley");
		});

		it('handles Italian name with particle', () => {
			expect(formatPersonName('LEONARDO DA VINCI')).toBe('Leonardo da Vinci');
		});

		it('handles Dutch name with van der ("der" not a particle)', () => {
			expect(formatPersonName('PIETER VAN DER MERWE')).toBe(
				'Pieter van Der Merwe'
			);
		});

		it('handles German name with von', () => {
			expect(formatPersonName('LUDWIG VON BEETHOVEN')).toBe(
				'Ludwig von Beethoven'
			);
		});

		it('handles Arabic name with al and ibn', () => {
			expect(formatPersonName('KHALID IBN AL WALID')).toBe(
				'Khalid ibn al Walid'
			);
		});
	});
});

describe('repairDistortedPersonName', () => {
	describe('null / undefined / blank handling', () => {
		it('returns undefined for undefined', () => {
			expect(repairDistortedPersonName(undefined)).toBeUndefined();
		});

		it('returns undefined for null', () => {
			expect(repairDistortedPersonName(null)).toBeUndefined();
		});

		it('returns undefined for empty string', () => {
			expect(repairDistortedPersonName('')).toBeUndefined();
		});

		it('returns undefined for whitespace-only string', () => {
			expect(repairDistortedPersonName('   ')).toBeUndefined();
		});
	});

	describe('whitespace normalization', () => {
		it('collapses multiple spaces', () => {
			expect(repairDistortedPersonName('John   Smith')).toBe('John Smith');
		});

		it('trims leading and trailing spaces', () => {
			expect(repairDistortedPersonName('  John Smith  ')).toBe('John Smith');
		});
	});

	describe('apostrophe distortion repair', () => {
		it("repairs Ts'Ele apostrophe case (lowercases suffix)", () => {
			const r = repairDistortedPersonName("Ts'Ele");
			expect(r).toBe("Ts'ele");
		});

		it('normalizes unicode apostrophes', () => {
			const r = repairDistortedPersonName('Ts\u2019ele');
			expect(r).toBe("Ts'ele");
		});

		it('normalizes left quote unicode apostrophe', () => {
			const r = repairDistortedPersonName('Ts\u2018ele');
			expect(r).toBe("Ts'ele");
		});

		it('normalizes modifier letter apostrophe', () => {
			const r = repairDistortedPersonName('Ts\u02BCele');
			expect(r).toBe("Ts'ele");
		});

		it('normalizes backtick apostrophe', () => {
			const r = repairDistortedPersonName('Ts\u0060ele');
			expect(r).toBe("Ts'ele");
		});

		it('normalizes acute accent apostrophe', () => {
			const r = repairDistortedPersonName('Ts\u00B4ele');
			expect(r).toBe("Ts'ele");
		});

		it("repairs mid-word apostrophe uppercase: Nts'EBO \u2192 Nts'ebo", () => {
			const r = repairDistortedPersonName("Nts'EBO");
			expect(r).toBe("Nts'ebo");
		});

		it("repairs MA'LEBO \u2192 Ma'lebo", () => {
			const r = repairDistortedPersonName("MA'LEBO");
			expect(r).toBe("Ma'lebo");
		});
	});

	describe('hyphenated name repair', () => {
		it('repairs hyphenated name parts independently', () => {
			const r = repairDistortedPersonName("Mants'O-Lets'OLO");
			expect(r).toBe("Mants'o-Lets'olo");
		});
	});

	describe('clean names pass through', () => {
		it('preserves a normal clean name', () => {
			expect(repairDistortedPersonName('John Smith')).toBe('John Smith');
		});

		it('preserves a hyphenated clean name', () => {
			expect(repairDistortedPersonName('Mary-Jane Watson')).toBe(
				'Mary-Jane Watson'
			);
		});

		it("preserves O'Brien style", () => {
			expect(repairDistortedPersonName("O'Brien")).toBe("O'Brien");
		});
	});

	describe('full name repair scenarios', () => {
		it('repairs distortions in a multi-word name', () => {
			const r = repairDistortedPersonName("Nts'EBO Mokoena");
			expect(r).toBe("Nts'ebo Mokoena");
		});

		it('handles unicode + distortion in full name', () => {
			const r = repairDistortedPersonName('Nts\u2019EBO Phiri');
			expect(r).toBe("Nts'ebo Phiri");
		});

		it('handles multiple distorted words in a name', () => {
			const r = repairDistortedPersonName("Nts'EBO Mants'O-Lets'OLO");
			expect(r).toBe("Nts'ebo Mants'o-Lets'olo");
		});
	});
});
