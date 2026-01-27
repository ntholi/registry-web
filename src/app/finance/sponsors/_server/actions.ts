'use server';

import type { sponsors } from '@/core/database';
import { sponsorsService as service } from './service';

type Sponsor = typeof sponsors.$inferInsert;

export async function getSponsor(id: number) {
	return service.get(id);
}

export async function findAllSponsors(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['name'],
	});
}

export async function getAllSponsors() {
	return service.getAll();
}

export async function createSponsor(sponsor: Sponsor) {
	return service.create(sponsor);
}

export async function updateSponsor(id: number, sponsor: Sponsor) {
	return service.update(id, sponsor);
}

export async function deleteSponsor(id: number) {
	return service.delete(id);
}

export async function getSponsoredStudent(stdNo: number, termId: number) {
	return await service.getSponsoredStudent(stdNo, termId);
}

export async function getSponsoredStudents(
	sponsorId: string,
	page: number = 1,
	search = ''
) {
	return service.getSponsoredStudents(sponsorId, {
		page,
		search,
		limit: 10,
	});
}

export async function getAllSponsoredStudents(
	page: number = 1,
	search = '',
	sponsorId?: string,
	programId?: string,
	termId?: string,
	clearedOnly?: boolean
) {
	return service.getAllSponsoredStudents({
		page,
		search,
		sponsorId,
		programId,
		termId,
		clearedOnly,
		limit: 10,
	});
}

export async function updateStudentSponsorship(data: {
	stdNo: number;
	termId: number;
	sponsorName: string;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
}) {
	const sponsors = await service.findAll({
		page: 1,
		search: data.sponsorName,
		searchColumns: ['name'],
	});

	const sponsor = sponsors.items.find((s) => s.name === data.sponsorName);

	if (!sponsor) {
		throw new Error(`Sponsor with name "${data.sponsorName}" not found`);
	}

	return service.updateStudentSponsorship({
		stdNo: data.stdNo,
		termId: data.termId,
		sponsorId: sponsor.id,
		borrowerNo: data.borrowerNo,
		bankName: data.bankName,
		accountNumber: data.accountNumber,
	});
}

export async function updateStudentSponsorshipById(data: {
	stdNo: number;
	termId: number;
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
}) {
	return service.updateStudentSponsorship(data);
}

export async function getStudentCurrentSponsorship(stdNo: number) {
	return service.getStudentCurrentSponsorship(stdNo);
}

export async function bulkUpdateAccountDetails(
	items: Array<{
		stdNoOrName: string;
		bankName: string;
		accountNumber: string;
	}>,
	batchSize: number = 100
) {
	return service.bulkUpdateAccountDetails(items, batchSize);
}

export async function getStudentSponsors(stdNo: number) {
	return service.getStudentSponsors(stdNo);
}

export async function createSponsoredStudent(data: {
	stdNo: number;
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
}) {
	return service.createSponsoredStudent(data);
}

export async function updateSponsoredStudent(
	id: number,
	data: {
		sponsorId?: number;
		borrowerNo?: string | null;
		bankName?: string | null;
		accountNumber?: string | null;
	}
) {
	return service.updateSponsoredStudent(id, data);
}

export async function getSponsoredStudentById(id: number) {
	return service.getSponsoredStudentById(id);
}
