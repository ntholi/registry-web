'use server';

import { documents } from '@/db/schema';
import { documentsService as service } from './service';

type Document = typeof documents.$inferInsert;

export async function getDocument(id: string) {
  return service.get(id);
}

export async function getDocuments(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createDocument(document: Document) {
  return service.create(document);
}

export async function updateDocument(id: string, document: Partial<Document>) {
  return service.update(id, document);
}

export async function deleteDocument(id: string) {
  return service.delete(id);
}
