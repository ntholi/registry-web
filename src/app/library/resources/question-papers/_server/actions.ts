'use server';

import { eq } from 'drizzle-orm';
import { auth } from '@/core/auth';
import { db, documents, questionPapers } from '@/core/database';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import type { QuestionPaperFormData } from '../_lib/types';
import { questionPapersService } from './service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function getQuestionPaper(id: string) {
	return questionPapersService.getWithRelations(id);
}

export async function getQuestionPapers(
	page = 1,
	search = '',
	moduleId?: number,
	termId?: number
) {
	return questionPapersService.getQuestionPapers(
		page,
		search,
		moduleId,
		termId
	);
}

export async function createQuestionPaper(data: QuestionPaperFormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const { moduleId, termId, assessmentType, file } = data;

	if (!file || !moduleId || !termId || !assessmentType) {
		throw new Error('Missing required fields');
	}

	if (file.size > MAX_FILE_SIZE) {
		throw new Error('File size exceeds 10MB limit');
	}

	const key = generateUploadKey(StoragePaths.questionPaper, file.name);
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

		const [questionPaper] = await tx
			.insert(questionPapers)
			.values({
				documentId: doc.id,
				moduleId,
				termId,
				assessmentType,
			})
			.returning();

		return questionPaper;
	});
}

export async function updateQuestionPaper(
	id: string,
	data: QuestionPaperFormData
) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Unauthorized');

	const { moduleId, termId, assessmentType, file } = data;

	if (!moduleId || !termId || !assessmentType) {
		throw new Error('Missing required fields');
	}

	const existing = await questionPapersService.getWithRelations(id);
	if (!existing) throw new Error('Question paper not found');

	return db.transaction(async (tx) => {
		if (file && file.size > 0) {
			if (file.size > MAX_FILE_SIZE) {
				throw new Error('File size exceeds 10MB limit');
			}

			if (existing.document?.fileUrl) {
				await deleteFile(existing.document.fileUrl);
			}

			const key = generateUploadKey(StoragePaths.questionPaper, file.name);
			await uploadFile(file, key);
			const fileName = key.split('/').pop()!;

			await tx
				.update(documents)
				.set({ fileName, fileUrl: key })
				.where(eq(documents.id, existing.documentId));
		}

		const [updated] = await tx
			.update(questionPapers)
			.set({
				moduleId,
				termId,
				assessmentType,
			})
			.where(eq(questionPapers.id, id))
			.returning();

		return updated;
	});
}

export async function deleteQuestionPaper(id: string) {
	const existing = await questionPapersService.getWithRelations(id);
	if (!existing) throw new Error('Question paper not found');

	if (existing.document?.fileUrl) {
		await deleteFile(existing.document.fileUrl);
	}

	await db.transaction(async (tx) => {
		await tx.delete(questionPapers).where(eq(questionPapers.id, id));
		if (existing.documentId) {
			await tx.delete(documents).where(eq(documents.id, existing.documentId));
		}
	});
}
