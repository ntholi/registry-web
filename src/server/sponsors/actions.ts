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

export async function updateStudentSponsorship(data: {
  stdNo: number;
  termId: number;
  sponsorName: string;
  borrowerNo?: string;
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
  });
}
