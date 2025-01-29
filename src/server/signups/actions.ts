'use server';

import { signups } from '@/db/schema';
import { signupsService as service } from './service';

type Signup = typeof signups.$inferInsert;

export async function getSignup(userId: string) {
  return service.get(userId);
}

export async function findAllSignups(page: number = 1, search = '') {
  return service.findAll({ page, search });
}

export async function createSignup(signup: Signup) {
  return service.create(signup);
}

export async function updateSignup(id: string, signup: Signup) {
  return service.update(id, signup);
}

export async function deleteSignup(id: string) {
  return service.delete(id);
}
