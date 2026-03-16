'use server';

import { eq } from 'drizzle-orm';
import { auth } from '@/core/auth';
import {
	db,
	documents,
	publicationAuthors,
	publications,
} from '@/core/database';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import { createAction } from '@/shared/lib/actions/actionResult';
import type { PublicationFormData, PublicationType } from '../_lib/types';
import { publicationsService } from './service';

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

export const createPublication = createAction(
	async (data: PublicationFormData) => {
		const session = await auth();
		if (!session?.user?.id) throw new Error('Unauthorized');

		const { title, abstract, datePublished, type, authorIds, file } = data;

		if (!file || !title || !type) {
			throw new Error('Missing required fields');
		}

		if (file.size > MAX_FILE_SIZE) {
			throw new Error('File size exceeds 10MB limit');
		}

		const key = generateUploadKey(StoragePaths.publication, file.name);
		await uploadFile(file, key);

		return db.transaction(async (tx) => {
			const fileName = key.split('/').pop()!;
			const [doc] = await tx
				.insert(documents)
				.values({
					fileName,
					fileUrl: key,
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
);

export const updatePublication = createAction(
	async (id: string, data: PublicationFormData) => {
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
					await deleteFile(existing.document.fileUrl);
				}

				const key = generateUploadKey(StoragePaths.publication, file.name);
				await uploadFile(file, key);
				const fileName = key.split('/').pop()!;

				await tx
					.update(documents)
					.set({ fileName, fileUrl: key })
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
);

export const deletePublication = createAction(async (id: string) => {
	const existing = await publicationsService.getWithRelations(id);
	if (!existing) throw new Error('Publication not found');

	if (existing.document?.fileUrl) {
		await deleteFile(existing.document.fileUrl);
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
});
