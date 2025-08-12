'use server';

import { sponsors } from '@/db/schema';
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
  return service.getSponsoredStudent(stdNo, termId);
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
  confirmed?: boolean,
  termId?: string,
  clearedOnly?: boolean
) {
  return service.getAllSponsoredStudents({
    page,
    search,
    sponsorId,
    programId,
    confirmed,
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
  confirmed?: boolean;
}) {
  return service.updateStudentSponsorship(data);
}

export async function getStudentCurrentSponsorship(stdNo: number) {
  return service.getStudentCurrentSponsorship(stdNo);
}

export async function updateAccountDetails(data: {
  stdNoOrName: string;
  bankName: string;
  accountNumber: string;
}) {
  return service.updateAccountDetails(data);
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

export async function confirmAccountDetails(stdNo: number, termId: number) {
  return service.confirmAccountDetails(stdNo, termId);
}
