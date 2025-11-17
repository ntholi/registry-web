import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { sponsors, users } from '@/core/database';
import { resetMockUser, setMockUser } from '@/test/mocks.auth';
import { createSponsor, updateSponsor } from '../actions';

vi.mock('@/core/platform/withAuth', () => {
	return vi.importActual('@/test/mock.withAuth');
});

type Sponsor = typeof sponsors.$inferSelect;
type User = typeof users.$inferSelect;

describe('Sponsor Permissions', () => {
	let createdSponsor: Sponsor | undefined;

	beforeEach(async () => {
		setMockUser({ role: 'admin' } as User);
		const newSponsor = { name: 'Initial Test Sponsor', code: 'INIT01' };
		createdSponsor = await createSponsor(newSponsor);
	});

	afterEach(() => {
		resetMockUser();
		vi.clearAllMocks();
	});

	describe('Admin Users', () => {
		it('should allow an admin to create a sponsor', async () => {
			setMockUser({ role: 'admin' } as User);
			const newSponsor = { name: 'Admin Test Sponsor', code: 'ADMIN1' };
			const sponsor = await createSponsor(newSponsor);
			expect(sponsor).toBeDefined();
			expect(sponsor.name).toBe(newSponsor.name);
		});

		it('should allow an admin to update a sponsor', async () => {
			setMockUser({ role: 'admin' } as User);
			const sponsorToUpdate = { name: 'Updated Sponsor Name', code: 'UPD01' };
			const updatedSponsor = await updateSponsor(
				createdSponsor!.id,
				sponsorToUpdate
			);
			expect(updatedSponsor).toBeDefined();
			expect(updatedSponsor?.name).toBe(sponsorToUpdate.name);
		});
	});
});
