import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { sponsors, users } from '@/core/database/schema';
import {
	resetMockUser,
	setMockUser,
} from '@/modules/admin/features/test/server/mocks.auth';
import {
	createSponsor,
	deleteSponsor,
	findAllSponsors,
	getSponsor,
	updateSponsor,
} from '@/modules/finance/features/sponsors/server/actions';

vi.mock('@/server/base/withAuth', () => {
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

		it('should allow an admin to delete a sponsor', async () => {
			setMockUser({ role: 'admin' } as User);
			const sponsorIdToDelete = createdSponsor?.id;
			// @ts-expect-error - Testing with potentially undefined ID
			await deleteSponsor(sponsorIdToDelete);

			// @ts-expect-error - Testing with potentially undefined ID
			const deletedSponsor = await getSponsor(sponsorIdToDelete);
			expect(deletedSponsor).toBeNull();
		});

		it('should allow an admin to get a sponsor', async () => {
			setMockUser({ role: 'admin' } as User);
			// @ts-expect-error - Testing with potentially undefined ID
			const sponsor = await getSponsor(createdSponsor?.id);
			expect(sponsor).toBeDefined();
			expect(sponsor?.name).toBe('Initial Test Sponsor');
		});

		it('should allow an admin to find all sponsors', async () => {
			setMockUser({ role: 'admin' } as User);
			const sponsors = await findAllSponsors();
			expect(sponsors).toBeDefined();
			expect(sponsors.items).toBeDefined();
		});
	});

	describe('Finance Users', () => {
		it('should allow a finance user to create a sponsor', async () => {
			setMockUser({ role: 'finance' } as User);
			const newSponsor = { name: 'Finance Test Sponsor', code: 'FIN001' };
			const sponsor = await createSponsor(newSponsor);
			expect(sponsor).toBeDefined();
			expect(sponsor.name).toBe(newSponsor.name);
		});

		it('should allow a finance user to update a sponsor', async () => {
			setMockUser({ role: 'finance' } as User);
			const sponsorToUpdate = {
				name: 'Finance Updated Sponsor Name',
				code: 'FINUP1',
			};
			const updatedSponsor = await updateSponsor(
				createdSponsor!.id,
				sponsorToUpdate
			);
			expect(updatedSponsor).toBeDefined();
			expect(updatedSponsor?.name).toBe(sponsorToUpdate.name);
		});

		it('should allow a finance user to delete a sponsor', async () => {
			setMockUser({ role: 'finance' } as User);
			const sponsorIdToDelete = createdSponsor?.id;
			// @ts-expect-error - Testing with potentially undefined ID
			await deleteSponsor(sponsorIdToDelete);

			// @ts-expect-error - Testing with potentially undefined ID
			const deletedSponsor = await getSponsor(sponsorIdToDelete);
			expect(deletedSponsor).toBeNull();
		});

		it('should allow a finance user to get a sponsor', async () => {
			setMockUser({ role: 'finance' } as User);
			// @ts-expect-error - Testing with potentially undefined ID
			const sponsor = await getSponsor(createdSponsor?.id);
			expect(sponsor).toBeDefined();
			expect(sponsor?.name).toBe('Initial Test Sponsor');
		});

		it('should allow a finance user to find all sponsors', async () => {
			setMockUser({ role: 'finance' } as User);
			const sponsors = await findAllSponsors();
			expect(sponsors).toBeDefined();
			expect(sponsors.items).toBeDefined();
		});
	});

	describe('Non-Admin/Finance Users', () => {
		it('should not allow a regular user to create a sponsor', async () => {
			setMockUser({ role: 'user' } as User);
			const newSponsor = { name: 'User Test Sponsor', code: 'USER01' };
			await expect(createSponsor(newSponsor)).rejects.toThrow('Forbidden');
		});

		it('should not allow a regular user to update a sponsor', async () => {
			setMockUser({ role: 'user' } as User);
			const sponsorToUpdate = {
				name: 'User Updated Sponsor Name',
				code: 'USERUP',
			};
			await expect(
				updateSponsor(createdSponsor!.id, sponsorToUpdate)
			).rejects.toThrow('Forbidden');
		});

		it('should not allow a regular user to delete a sponsor', async () => {
			setMockUser({ role: 'user' } as User);
			const sponsorIdToDelete = createdSponsor?.id;
			// @ts-expect-error - Testing with potentially undefined ID
			await expect(deleteSponsor(sponsorIdToDelete)).rejects.toThrow(
				'Forbidden'
			);
		});

		it('should allow a regular user to get a sponsor', async () => {
			setMockUser({ role: 'user' } as User);
			// @ts-expect-error - Testing with potentially undefined ID
			const sponsor = await getSponsor(createdSponsor?.id);
			expect(sponsor).toBeDefined();
			expect(sponsor?.name).toBe('Initial Test Sponsor');
		});

		it('should allow a regular user to find all sponsors', async () => {
			setMockUser({ role: 'user' } as User);
			const sponsors = await findAllSponsors();
			expect(sponsors).toBeDefined();
			expect(sponsors.items).toBeDefined();
		});
	});

	describe('Registry Users', () => {
		it('should allow a registry user to get a sponsor', async () => {
			setMockUser({ role: 'registry' } as User);
			// @ts-expect-error - Testing with potentially undefined ID
			const sponsor = await getSponsor(createdSponsor?.id);
			expect(sponsor).toBeDefined();
			expect(sponsor?.name).toBe('Initial Test Sponsor');
		});

		it('should allow a registry user to find all sponsors', async () => {
			setMockUser({ role: 'registry' } as User);
			const sponsors = await findAllSponsors();
			expect(sponsors).toBeDefined();
			expect(sponsors.items).toBeDefined();
		});

		it('should not allow a registry user to create a sponsor', async () => {
			setMockUser({ role: 'registry' } as User);
			const newSponsor = { name: 'Registry Test Sponsor', code: 'REG001' };
			await expect(createSponsor(newSponsor)).rejects.toThrow('Forbidden');
		});

		it('should not allow a registry user to update a sponsor', async () => {
			setMockUser({ role: 'registry' } as User);
			const sponsorToUpdate = {
				name: 'Registry Updated Sponsor Name',
				code: 'REGUP1',
			};
			await expect(
				updateSponsor(createdSponsor!.id, sponsorToUpdate)
			).rejects.toThrow('Forbidden');
		});

		it('should not allow a registry user to delete a sponsor', async () => {
			setMockUser({ role: 'registry' } as User);
			const sponsorIdToDelete = createdSponsor?.id;
			// @ts-expect-error - Testing with potentially undefined ID
			await expect(deleteSponsor(sponsorIdToDelete)).rejects.toThrow(
				'Forbidden'
			);
		});
	});
});
