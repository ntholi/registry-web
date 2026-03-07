'use server';

import { deleteFile, uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	getPublicUrl,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import type { DocumentType } from '../_schema/documents';
import { documentsService as service } from './service';

export async function getStudentDocuments(stdNo: number) {
	return service.getByStudent(stdNo);
}

export async function createDocument(data: {
	fileName: string;
	fileUrl: string;
	type: DocumentType;
	stdNo: number;
}) {
	return service.create(data);
}

export async function uploadAndCreateDocument(data: {
	file: File;
	type: DocumentType;
	stdNo: number;
}) {
	const key = generateUploadKey(
		(fileName) => StoragePaths.studentDocument(data.stdNo, fileName),
		data.file.name
	);
	await uploadFile(data.file, key);
	return service.create({
		fileName: data.file.name,
		fileUrl: key,
		type: data.type,
		stdNo: data.stdNo,
	});
}

export async function deleteDocument(id: string) {
	const doc = await service.get(id);
	if (doc?.document.fileUrl) {
		await deleteFile(doc.document.fileUrl);
	}
	return service.delete(id);
}

export async function getDocumentUrl(
	fileUrl: string | undefined | null
): Promise<string | null> {
	if (!fileUrl) return null;
	return getPublicUrl(fileUrl);
}
