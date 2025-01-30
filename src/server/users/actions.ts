'use server';

import { users } from '@/db/schema';
import { usersService }@/db/schema

type User = typeof users.$inferInsert;

export async function getUser(id: string) {
  return usersService.get(id);
}

export async function findAllUsers(page: number = 1, search = '') {
  return usersService.findAll({ page, search });
}

export async function createUser(user: User) {
  return usersService.create(user);
}

export async function updateUser(id: string, user: User) {
  return usersService.update(id, user);
}

export async function deleteUser(id: string) {
  return usersService.delete(id);
}
