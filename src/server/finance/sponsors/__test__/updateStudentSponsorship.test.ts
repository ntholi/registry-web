import { studentsService } from '@server/registry/students/service';
import { termsService } from '@server/registry/terms/service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { sponsors, terms, users } from '@/db/schema';
import { resetMockUser, setMockUser } from '@/server/admin/test/mocks.auth';
import { sponsorsService } from '../service';

vi.mock('@/server/base/withAuth', () => {
	return vi.importActual('@/test/mock.withAuth');
});

type User = typeof users.$inferSelect;
type Sponsor = typeof sponsors.$inferSelect;
type Term = typeof terms.$inferSelect;

describe('updateStudentSponsorship Authorization', () => {
	let testSponsor: Sponsor;
	let testTerm: Term;

	const testStdNo = 12345;

	beforeEach(async () => {
		setMockUser({ role: 'admin' } as User);

		await studentsService.create({
			stdNo: testStdNo,
			name: 'Test Student',
			nationalId: 'TEST123',
		});
		testTerm = await termsService.create({
			name: 'Test Term',
			semester: 1,
			isActive: true,
		});
		testSponsor = await sponsorsService.create({
			name: 'Test Sponsor',
			code: 'TEST',
		});
	});

	afterEach(() => {
		resetMockUser();
		vi.clearAllMocks();
	});

	describe('Admin Users', () => {
		it('should allow admin to update student sponsorship', async () => {
			setMockUser({ role: 'admin' } as User);

			const result = await sponsorsService.updateStudentSponsorship({
				stdNo: testStdNo,
				termId: testTerm.id,
				sponsorId: testSponsor.id,
			});

			expect(result).toBeDefined();
		});
	});

	describe('Registry Users', () => {
		it('should allow registry to update student sponsorship', async () => {
			setMockUser({ role: 'registry' } as User);

			const result = await sponsorsService.updateStudentSponsorship({
				stdNo: testStdNo,
				termId: testTerm.id,
				sponsorId: testSponsor.id,
			});

			expect(result).toBeDefined();
		});
	});

	describe('Finance Users', () => {
		it('should allow finance to update student sponsorship', async () => {
			setMockUser({ role: 'finance' } as User);

			const result = await sponsorsService.updateStudentSponsorship({
				stdNo: testStdNo,
				termId: testTerm.id,
				sponsorId: testSponsor.id,
			});

			expect(result).toBeDefined();
		});
	});

	describe('Student Users', () => {
		it('should allow student to update their own sponsorship', async () => {
			setMockUser({
				id: 'student-123',
				name: 'Test Student',
				email: 'student@test.com',
				role: 'student',
				stdNo: testStdNo,
				position: null,
				emailVerified: null,
				image: null,
			} as User);

			const result = await sponsorsService.updateStudentSponsorship({
				stdNo: testStdNo,
				termId: testTerm.id,
				sponsorId: testSponsor.id,
			});

			expect(result).toBeDefined();
		});

		it("should not allow student to update another student's sponsorship", async () => {
			const differentStdNo = 54321;
			setMockUser({
				id: 'student-123',
				name: 'Test Student',
				email: 'student@test.com',
				role: 'student',
				stdNo: testStdNo,
				position: null,
				emailVerified: null,
				image: null,
			} as User);

			await expect(
				sponsorsService.updateStudentSponsorship({
					stdNo: differentStdNo,
					termId: testTerm.id,
					sponsorId: testSponsor.id,
				})
			).rejects.toThrow('Forbidden');
		});

		it('should handle student with missing stdNo', async () => {
			setMockUser({
				id: 'student-123',
				name: 'Test Student',
				email: 'student@test.com',
				role: 'student',
				stdNo: undefined,
				position: null,
				emailVerified: null,
				image: null,
			} as User);

			await expect(
				sponsorsService.updateStudentSponsorship({
					stdNo: testStdNo,
					termId: testTerm.id,
					sponsorId: testSponsor.id,
				})
			).rejects.toThrow('Forbidden');
		});
	});

	describe('Other Users', () => {
		it('should not allow regular user to update student sponsorship', async () => {
			setMockUser({ role: 'user' } as User);

			await expect(
				sponsorsService.updateStudentSponsorship({
					stdNo: testStdNo,
					termId: testTerm.id,
					sponsorId: testSponsor.id,
				})
			).rejects.toThrow('Forbidden');
		});

		it('should not allow lecturer to update student sponsorship', async () => {
			setMockUser({
				id: 'lecturer-123',
				name: 'Test Lecturer',
				email: 'lecturer@test.com',
				role: 'user',
				position: 'lecturer',
				emailVerified: null,
				image: null,
			} as User);

			await expect(
				sponsorsService.updateStudentSponsorship({
					stdNo: testStdNo,
					termId: testTerm.id,
					sponsorId: testSponsor.id,
				})
			).rejects.toThrow('Forbidden');
		});
	});

	describe('Edge Cases', () => {
		it('should handle updateStudentSponsorship with borrower number', async () => {
			setMockUser({ role: 'admin' } as User);

			const result = await sponsorsService.updateStudentSponsorship({
				stdNo: testStdNo,
				termId: testTerm.id,
				sponsorId: testSponsor.id,
				borrowerNo: 'BOR123456',
			});

			expect(result).toBeDefined();
		});

		it('should handle student updating with NMDS sponsor and borrower number', async () => {
			setMockUser({ role: 'admin' } as User);
			const nmdsSponsor = await sponsorsService.create({
				name: 'NMDS',
				code: 'NMDS',
			});

			setMockUser({
				id: 'student-123',
				name: 'Test Student',
				email: 'student@test.com',
				role: 'student',
				stdNo: testStdNo,
				position: null,
				emailVerified: null,
				image: null,
			} as User);

			const result = await sponsorsService.updateStudentSponsorship({
				stdNo: testStdNo,
				termId: testTerm.id,
				sponsorId: nmdsSponsor.id,
				borrowerNo: 'NMDS123456',
			});

			expect(result).toBeDefined();
		});
	});
});
