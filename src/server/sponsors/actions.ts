'use server';

import { sponsors } from '@/db/schema';
import { sponsorsService as service} from './service';

type Sponsor = typeof sponsors.$inferInsert;

export async function getSponsor(id: number) {
  return service.get(id);
}

export async function findAllSponsors(page: number = 1, search = '') {
  return service.findAll({ page, search });
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

export async function getSponsoredStudent(stdNo: number) {
  return service.getSponsoredStudent(stdNo);
}