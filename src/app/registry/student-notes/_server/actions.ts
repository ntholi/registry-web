'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
import type { NoteVisibility } from '../_schema/studentNotes';
import { studentNotesService as service } from './service';

export async function getStudentNotes(stdNo: number) {
	return service.getByStudent(stdNo);
}

export async function findAllNotes(page: number, search: string) {
	return service.findAll({ page, search });
}

export const createStudentNote = createAction(
	async (stdNo: number, content: string, visibility: NoteVisibility) => {
		return service.createNote(stdNo, content, visibility);
	}
);

export const updateStudentNote = createAction(
	async (id: string, content: string, visibility: NoteVisibility) => {
		return service.updateNote(id, content, visibility);
	}
);

export const deleteStudentNote = createAction(async (id: string) => {
	return service.deleteNote(id);
});

export async function getStudentNote(id: string) {
	return service.getNoteById(id);
}

export const uploadNoteAttachment = createAction(
	async (stdNo: number, noteId: string, formData: FormData) => {
		const fileValue = formData.get('file');
		if (!(fileValue instanceof File)) {
			throw new Error('File is required');
		}

		return service.uploadAttachment(
			stdNo,
			noteId,
			fileValue,
			fileValue.name,
			fileValue.type
		);
	}
);

export const deleteNoteAttachment = createAction(async (id: string) => {
	return service.deleteAttachment(id);
});
