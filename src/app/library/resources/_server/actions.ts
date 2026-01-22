'use server';

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '@/core/auth';
import { db, documents, libraryResources } from '@/core/database';
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
import {
	MAX_FILE_SIZE,
	type ResourceFormData,
	type ResourceType,
} from '../_lib/types';
import { resourcesService } from './service';

const BASE_URL = 'https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev';
const FOLDER = 'library/resources';

export async function getResource(id: number) {
	return resourcesService.getWithRelations(id);
}

export async function getResources(page = 1, search = '', type?: ResourceType) {
	return resourcesService.getResources(page, search, type);
}

export async function getAllResources() {
	return resourcesService.getAll();
}

export async function createResource(data: ResourceFormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const { title, description, type, file } = data;

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

		const [resource] = await tx
			.insert(libraryResources)
			.values({
				documentId: doc.id,
				title,
				description: description || null,
				type,
				uploadedBy: session.user?.id,
			})
			.returning();

		return resource;
	});
}

export async function updateResource(id: number, data: ResourceFormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const { title, description, type, file } = data;

	if (!title || !type) {
		throw new Error('Missing required fields');
	}

	const existing = await resourcesService.getWithRelations(id);
	if (!existing) throw new Error('Resource not found');

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
				.set({
					fileName: file.name,
					fileUrl,
				})
				.where(eq(documents.id, existing.documentId));
		}

		const [updated] = await tx
			.update(libraryResources)
			.set({
				title,
				description: description || null,
				type,
			})
			.where(eq(libraryResources.id, id))
			.returning();

		return updated;
	});
}

export async function deleteResource(id: number) {
	const resource = await resourcesService.getWithRelations(id);
	if (!resource) throw new Error('Resource not found');

	if (resource.document?.fileUrl) {
		const key = resource.document.fileUrl.replace(`${BASE_URL}/`, '');
		await deleteDocument(key);
	}

	await db.transaction(async (tx) => {
		await tx.delete(libraryResources).where(eq(libraryResources.id, id));
		await tx.delete(documents).where(eq(documents.id, resource.documentId));
	});
}
