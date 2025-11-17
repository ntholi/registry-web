import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { sponsors } from '@/core/database';
import { setMockUser } from '@/test/mocks.auth';
import { sponsorsService } from '../service';

vi.mock('@/core/platform/withAuth', () => {
	return vi.importActual('@/test/mock.withAuth');
});

type Sponsor = typeof sponsors.$inferInsert;

describe('Sponsors Service', () => {
	beforeEach(() => {
		setMockUser({ role: 'admin' });
	});

	it('should create a new sponsor', async () => {
		const sponsorData: Sponsor = {
			name: 'Test Sponsor',
			code: 'TS001',
		};

		const createdSponsor = await sponsorsService.create(sponsorData);

		expect(createdSponsor).toBeDefined();
		expect(createdSponsor.name).toBe('Test Sponsor');
		expect(createdSponsor.id).toBeDefined();
		expect(createdSponsor.createdAt).toBeDefined();
	});
});
