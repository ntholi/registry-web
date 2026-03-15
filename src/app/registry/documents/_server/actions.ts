'use server';

import { deleteFile, uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	getPublicUrl,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import { createAction } from '@/shared/lib/utils/actionResult';
import type { DocumentType } from '../_schema/documents';
import { documentsService as service } from './service';

export const getStudentDocuments = createAction(async (stdNo: number) =>
	service.getByStudent(stdNo)
);

export const createDocument = createAction(
	async (data: {
		fileName: string;
		fileUrl: string;
		type: DocumentType;
		stdNo: number;
	}) => service.create(data)
);

export const uploadAndCreateDocument = createAction(
	async (data: { file: File; type: DocumentType; stdNo: number }) => {
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
);

export const deleteDocument = createAction(async (id: string) => {
	const doc = await service.get(id);
	if (doc?.document.fileUrl) {
		await deleteFile(doc.document.fileUrl);
	}
	return service.delete(id);
});

export const getDocumentUrl = createAction(
	async (fileUrl: string | undefined | null): Promise<string | null> => {
		if (!fileUrl) return null;
		return getPublicUrl(fileUrl);
	}
);
