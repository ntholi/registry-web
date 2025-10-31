'use server';

import type { documents } from '@/db/schema';
import { documentsService as service } from './service';

type Document = typeof documents.$inferInsert;

export async function getDocument(id: string) {
	return service.get(id);
}

export async function getDocuments(page: number = 1, search = '') {
	return service.getAll({ page, search });
}

export async function getStudentDocuments(stdNo: number) {
	return service.getByStudent(stdNo);
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

export async function getDocumentUrl(fileName: string | undefined | null): Promise<string | null> {
	if (!fileName) return null;
	try {
		const url = `https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev/documents/${fileName}`;

		try {
			const response = await fetch(url, {
				method: 'HEAD',
				cache: 'no-store',
				next: { revalidate: 0 },
			});
			if (response.ok) {
				const etag = response.headers.get('etag')?.replace(/"/g, '') || '';
				const lastModified = response.headers.get('last-modified') || '';
				const versionSource = etag || lastModified || Date.now().toString();
				return `${url}?v=${encodeURIComponent(versionSource)}`;
			}
		} catch (error) {
			console.error('Error:', error);
			return null;
		}

		return null;
	} catch (error) {
		console.error('Error checking document:', error);
		return null;
	}
}
