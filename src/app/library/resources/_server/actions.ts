'use server';

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '@/core/auth';
import { db, digitalResources } from '@/core/database';
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
import {
	MAX_FILE_SIZE,
	type ResourceFormData,
	type ResourceType,
} from '../_lib/types';
import { resourcesService } from './service';

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

	const { title, description, type, isDownloadable, file } = data;

	if (!file || !title || !type) {
		throw new Error('Missing required fields');
	}

	if (file.size > MAX_FILE_SIZE) {
		throw new Error('File size exceeds 10MB limit');
	}

	const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
	const fileName = `${nanoid()}.${ext}`;

	await uploadDocument(file, fileName, 'library/resources');

	const [resource] = await db
		.insert(digitalResources)
		.values({
			title,
			description: description || null,
			type,
			fileName,
			originalName: file.name,
			fileSize: file.size,
			mimeType: file.type,
			isDownloadable,
			uploadedBy: session.user.id,
		})
		.returning();

	return resource;
}

export async function updateResource(id: number, data: ResourceFormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const { title, description, type, isDownloadable, file } = data;

	if (!title || !type) {
		throw new Error('Missing required fields');
	}

	const existing = await resourcesService.get(id);
	if (!existing) throw new Error('Resource not found');

	let fileName = existing.fileName;
	let originalName = existing.originalName;
	let fileSize = existing.fileSize;
	let mimeType = existing.mimeType;

	if (file && file.size > 0) {
		if (file.size > MAX_FILE_SIZE) {
			throw new Error('File size exceeds 10MB limit');
		}

		await deleteDocument(`library/resources/${existing.fileName}`);

		const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
		fileName = `${nanoid()}.${ext}`;

		await uploadDocument(file, fileName, 'library/resources');
		originalName = file.name;
		fileSize = file.size;
		mimeType = file.type;
	}

	const [updated] = await db
		.update(digitalResources)
		.set({
			title,
			description: description || null,
			type,
			fileName,
			originalName,
			fileSize,
			mimeType,
			isDownloadable,
		})
		.where(eq(digitalResources.id, id))
		.returning();

	return updated;
}

export async function deleteResource(id: number) {
	const resource = await resourcesService.get(id);
	if (!resource) throw new Error('Resource not found');

	await deleteDocument(`library/resources/${resource.fileName}`);
	await resourcesService.delete(id);
}
