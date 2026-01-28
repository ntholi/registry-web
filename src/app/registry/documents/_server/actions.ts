'use server';

import type { NewDocumentStamp } from '../_schema/documentStamps';
import type { DocumentType } from '../_schema/documents';
import { documentsService as service } from './service';

type StampInput = Omit<NewDocumentStamp, 'id' | 'documentId' | 'createdAt'>;

export async function getStudentDocuments(stdNo: number) {
	return service.getByStudent(stdNo);
}

export async function createDocument(
	data: {
		fileName: string;
		fileUrl: string;
		type: DocumentType;
		stdNo: number;
	},
	stamps?: StampInput[]
) {
	return service.create(data, stamps);
}

export async function deleteDocument(id: string) {
	return service.delete(id);
}

export async function getDocumentUrl(
	fileName: string | undefined | null
): Promise<string | null> {
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

export async function saveDocumentStamps(
	documentId: string,
	stamps: Omit<NewDocumentStamp, 'id' | 'documentId' | 'createdAt'>[]
) {
	return service.saveStamps(documentId, stamps);
}

export async function getDocumentStamps(documentId: string) {
	return service.getStamps(documentId);
}

export async function deleteDocumentStamps(documentId: string) {
	return service.deleteStamps(documentId);
}
