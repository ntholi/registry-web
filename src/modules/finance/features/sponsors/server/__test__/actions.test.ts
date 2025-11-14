import { setMockUser } from '@admin/test';
import { beforeEach, describe, expect, it } from 'vitest';
import type { sponsors } from '@/core/database/schema';
import { sponsorsService } from '../service';

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

	it('should get a sponsor by id', async () => {
		const sponsorData: Sponsor = {
			name: 'Test Sponsor for Get',
			code: 'TS002',
		};

		const createdSponsor = await sponsorsService.create(sponsorData);

		const sponsor = await sponsorsService.get(createdSponsor.id);

		expect(sponsor).toBeDefined();
		expect(sponsor?.id).toBe(createdSponsor.id);
		expect(sponsor?.name).toBe('Test Sponsor for Get');
	});

	it('should return null for non-existent sponsor', async () => {
		const sponsor = await sponsorsService.get(999);

		expect(sponsor).toBeNull();
	});

	it('should create multiple sponsors and retrieve them', async () => {
		const sponsor1 = await sponsorsService.create({
			name: 'Sponsor 1',
			code: 'SP001',
		});

		const sponsor2 = await sponsorsService.create({
			name: 'Sponsor 2',
			code: 'SP002',
		});

		const retrievedSponsor1 = await sponsorsService.get(sponsor1.id);
		const retrievedSponsor2 = await sponsorsService.get(sponsor2.id);

		expect(retrievedSponsor1?.name).toBe('Sponsor 1');
		expect(retrievedSponsor2?.name).toBe('Sponsor 2');
		expect(retrievedSponsor1?.id).not.toBe(retrievedSponsor2?.id);
	});

	it('should handle unique constraint on sponsor names', async () => {
		await sponsorsService.create({
			name: 'Unique Sponsor',
			code: 'UNQ001',
		});

		await expect(
			sponsorsService.create({
				name: 'Unique Sponsor',
				code: 'UNQ002',
			})
		).rejects.toThrow();
	});

	it('should update sponsor information', async () => {
		const sponsor = await sponsorsService.create({
			name: 'Original Sponsor Name',
			code: 'ORG001',
		});

		const updatedSponsor = await sponsorsService.update(sponsor.id, {
			name: 'Updated Sponsor Name',
			code: 'UPD001',
		});

		expect(updatedSponsor).toBeDefined();
		expect(updatedSponsor.name).toBe('Updated Sponsor Name');
		expect(updatedSponsor.id).toBe(sponsor.id);
	});

	it('should delete a sponsor', async () => {
		const sponsor = await sponsorsService.create({
			name: 'Sponsor to Delete',
			code: 'DEL001',
		});

		await sponsorsService.delete(sponsor.id);

		const retrievedSponsor = await sponsorsService.get(sponsor.id);
		expect(retrievedSponsor).toBeNull();
	});

	it('should find all sponsors with pagination', async () => {
		await sponsorsService.create({ name: 'Sponsor A', code: 'SPA001' });
		await sponsorsService.create({ name: 'Sponsor B', code: 'SPB001' });
		await sponsorsService.create({ name: 'Sponsor C', code: 'SPC001' });

		const result = await sponsorsService.findAll({
			page: 1,
			size: 2,
		});

		expect(result).toBeDefined();
		expect(result.items).toHaveLength(2);
		expect(result.totalPages).toBeGreaterThan(1);
		expect(result.totalItems).toBeGreaterThan(2);
	});

	it('should search sponsors by name', async () => {
		await sponsorsService.create({
			name: 'Government Sponsor',
			code: 'GOV001',
		});
		await sponsorsService.create({ name: 'Private Company', code: 'PVT001' });
		await sponsorsService.create({ name: 'NGO Sponsor', code: 'NGO001' });

		const result = await sponsorsService.findAll({
			page: 1,
			search: 'Government',
			searchColumns: ['name'],
		});

		expect(result).toBeDefined();
		expect(result.items).toHaveLength(1);
		expect(result.items[0].name).toBe('Government Sponsor');
	});

	it('should get count of sponsors', async () => {
		const initialCount = await sponsorsService.count();

		await sponsorsService.create({
			name: 'Count Test Sponsor 1',
			code: 'CNT001',
		});
		await sponsorsService.create({
			name: 'Count Test Sponsor 2',
			code: 'CNT002',
		});

		const newCount = await sponsorsService.count();

		expect(newCount).toBe(initialCount + 2);
	});

	it('should get first sponsor', async () => {
		await sponsorsService.create({
			name: 'First Sponsor Test',
			code: 'FST001',
		});

		const firstSponsor = await sponsorsService.first();

		expect(firstSponsor).toBeDefined();
		expect(firstSponsor?.name).toBeDefined();
	});
});
