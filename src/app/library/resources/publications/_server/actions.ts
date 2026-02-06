'use server';

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '@/core/auth';
import {
	db,
	documents,
	publicationAuthors,
	publications,
} from '@/core/database';
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
import type { PublicationFormData, PublicationType } from '../_lib/types';
import { publicationsService } from './service';

const BASE_URL = 'https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev';
const FOLDER = 'library/publications';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function getPublication(id: string) {
	return publicationsService.getWithRelations(id);
}

export async function getPublications(
	page = 1,
	search = '',
	type?: PublicationType
) {
	return publicationsService.getPublications(page, search, type);
}

export async function createPublication(data: PublicationFormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const { title, abstract, datePublished, type, authorIds, file } = data;

	if (!file || !title || !type) {
		throw new Error('Missing required fields');
	}

	if (file.size > MAX_FILE_SIZE) {
		throw new Error('File size exceeds 10MB limit');
	}

	const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
	const fileName = `${nanoid()}.${ext}`;
	await uploadDocument(file, fileName, FOLDER);
	const fileUrl = `${BASE_URL}/${FOLDER}/${fileName}`;

	return db.transaction(async (tx) => {
		const [doc] = await tx
			.insert(documents)
			.values({
				fileName: fileName,
				fileUrl,
			})
			.returning();

		if (!doc) throw new Error('Failed to create document');

		const [publication] = await tx
			.insert(publications)
			.values({
				documentId: doc.id,
				title,
				abstract: abstract || null,
				datePublished: datePublished || null,
				type,
			})
			.returning();

		if (authorIds && authorIds.length > 0) {
			await tx.insert(publicationAuthors).values(
				authorIds.map((authorId) => ({
					publicationId: publication.id,
					authorId,
				}))
			);
		}

		return publication;
	});
}

export async function updatePublication(id: string, data: PublicationFormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const { title, abstract, datePublished, type, authorIds, file } = data;

	if (!title || !type) {
		throw new Error('Missing required fields');
	}

	const existing = await publicationsService.getWithRelations(id);
	if (!existing) throw new Error('Publication not found');

	return db.transaction(async (tx) => {
		if (file && file.size > 0) {
			if (file.size > MAX_FILE_SIZE) {
				throw new Error('File size exceeds 10MB limit');
			}

			if (existing.document?.fileUrl) {
				const key = existing.document.fileUrl.replace(`${BASE_URL}/`, '');
				await deleteDocument(key);
			}

			const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
			const fileName = `${nanoid()}.${ext}`;
			await uploadDocument(file, fileName, FOLDER);
			const fileUrl = `${BASE_URL}/${FOLDER}/${fileName}`;

			await tx
				.update(documents)
				.set({ fileName, fileUrl })
				.where(eq(documents.id, existing.documentId));
		}

		const [updated] = await tx
			.update(publications)
			.set({
				title,
				abstract: abstract || null,
				datePublished: datePublished || null,
				type,
			})
			.where(eq(publications.id, id))
			.returning();

		await tx
			.delete(publicationAuthors)
			.where(eq(publicationAuthors.publicationId, id));

		if (authorIds && authorIds.length > 0) {
			await tx.insert(publicationAuthors).values(
				authorIds.map((authorId) => ({
					publicationId: id,
					authorId,
				}))
			);
		}

		return updated;
	});
}

export async function deletePublication(id: string) {
	const existing = await publicationsService.getWithRelations(id);
	if (!existing) throw new Error('Publication not found');

	if (existing.document?.fileUrl) {
		const key = existing.document.fileUrl.replace(`${BASE_URL}/`, '');
		await deleteDocument(key);
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(publicationAuthors)
			.where(eq(publicationAuthors.publicationId, id));
		await tx.delete(publications).where(eq(publications.id, id));
		if (existing.documentId) {
			await tx.delete(documents).where(eq(documents.id, existing.documentId));
		}
	});
}
