'use server';

import type { sponsors } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { sponsorsService as service } from './service';

type Sponsor = typeof sponsors.$inferInsert;

export const getSponsor = createAction(async (id: number) => {
	return service.get(id);
});

export const findAllSponsors = createAction(
	async (page: number = 1, search: string = '') => {
		return service.findAll({
			page,
			search,
			searchColumns: ['name'],
		});
	}
);

export const getAllSponsors = createAction(async () => {
	return service.getAll();
});

export const createSponsor = createAction(async (sponsor: Sponsor) => {
	return service.create(sponsor);
});

export const updateSponsor = createAction(
	async (id: number, sponsor: Sponsor) => {
		return service.update(id, sponsor);
	}
);

export const deleteSponsor = createAction(async (id: number) => {
	return service.delete(id);
});

export const getSponsoredStudent = createAction(
	async (stdNo: number, termId: number) => {
		return service.getSponsoredStudent(stdNo, termId);
	}
);

export const getSponsoredStudents = createAction(
	async (sponsorId: string, page: number = 1, search: string = '') => {
		return service.getSponsoredStudents(sponsorId, {
			page,
			search,
			limit: 10,
		});
	}
);

export const getAllSponsoredStudents = createAction(
	async (
		page: number = 1,
		search: string = '',
		sponsorId?: string,
		programId?: string,
		termId?: string,
		clearedOnly?: boolean
	) => {
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
);

export const updateStudentSponsorship = createAction(
	async (data: {
		stdNo: number;
		termId: number;
		sponsorName: string;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) => {
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
);

export const updateStudentSponsorshipById = createAction(
	async (data: {
		stdNo: number;
		termId: number;
		sponsorId: number;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) => {
		return service.updateStudentSponsorship(data);
	}
);

export const getStudentCurrentSponsorship = createAction(
	async (stdNo: number) => {
		return service.getStudentCurrentSponsorship(stdNo);
	}
);

export const bulkUpdateAccountDetails = createAction(
	async (
		items: Array<{
			stdNoOrName: string;
			bankName: string;
			accountNumber: string;
		}>,
		batchSize: number = 100
	) => {
		return service.bulkUpdateAccountDetails(items, batchSize);
	}
);

export const getStudentSponsors = createAction(async (stdNo: number) => {
	return service.getStudentSponsors(stdNo);
});

export const createSponsoredStudent = createAction(
	async (data: {
		stdNo: number;
		sponsorId: number;
		borrowerNo?: string;
		bankName?: string;
		accountNumber?: string;
	}) => {
		return service.createSponsoredStudent(data);
	}
);

export const updateSponsoredStudent = createAction(
	async (
		id: number,
		data: {
			sponsorId?: number;
			borrowerNo?: string | null;
			bankName?: string | null;
			accountNumber?: string | null;
		}
	) => {
		return service.updateSponsoredStudent(id, data);
	}
);

export const getSponsoredStudentById = createAction(async (id: number) => {
	return service.getSponsoredStudentById(id);
});
