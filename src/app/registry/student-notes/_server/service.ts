import type { UserRole } from '@auth/_database';
import type { studentNotes } from '@/core/database';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission, {
	requireSessionUserId,
} from '@/core/platform/withPermission';
import { ALLOWED_MIME_TYPES, MAX_ATTACHMENT_SIZE } from '../_lib/constants';
import type { NoteVisibility } from '../_schema/studentNotes';
import StudentNotesRepository from './repository';

type StudentNoteDetails = Awaited<
	ReturnType<StudentNotesRepository['findNoteById']>
>;

class StudentNotesService extends BaseService<typeof studentNotes, 'id'> {
	private repo: StudentNotesRepository;

	constructor() {
		const repo = new StudentNotesRepository();
		super(repo, {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
			activityTypes: {
				create: 'student_note_created',
				update: 'student_note_updated',
				delete: 'student_note_deleted',
			},
		});
		this.repo = repo;
	}

	private requireRole(
		session?: { user?: { role?: string | null } } | null
	): UserRole {
		const role = session?.user?.role;
		if (!role) {
			throw new Error('Unauthorized');
		}
		return role as UserRole;
	}

	private ensureCanManageNote(
		note: StudentNoteDetails,
		userId: string,
		role: UserRole
	): asserts note is NonNullable<StudentNoteDetails> {
		if (!note) {
			throw new Error('Note not found');
		}

		if (role !== 'admin' && note.createdBy !== userId) {
			throw new Error('Not authorized');
		}
	}

	async getByStudent(stdNo: number) {
		return withPermission(
			async (session) =>
				this.repo.findByStudent(
					stdNo,
					requireSessionUserId(session),
					this.requireRole(session)
				),
			['dashboard']
		);
	}

	async findAll(options: QueryOptions<typeof studentNotes>) {
		return withPermission(
			async (session) =>
				this.repo.findAllNotes(
					requireSessionUserId(session),
					this.requireRole(session),
					options.page ?? 1,
					options.search
				),
			['dashboard']
		);
	}

	async getNoteById(id: string) {
		return withPermission(
			async () => this.repo.findNoteById(id),
			['dashboard']
		);
	}

	async createNote(stdNo: number, content: string, visibility: NoteVisibility) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);
				const role = this.requireRole(session);
				return this.repo.create(
					{
						stdNo,
						content,
						visibility,
						creatorRole: role,
						createdBy: userId,
					},
					{
						userId,
						role,
						activityType: 'student_note_created',
						stdNo,
					}
				);
			},
			['dashboard']
		);
	}

	async updateNote(id: string, content: string, visibility: NoteVisibility) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);
				const role = this.requireRole(session);
				const note = await this.repo.findNoteById(id);
				this.ensureCanManageNote(note, userId, role);

				return this.repo.update(
					id,
					{
						content,
						visibility,
					},
					{
						userId,
						role,
						activityType: 'student_note_updated',
						stdNo: note.stdNo,
					}
				);
			},
			['dashboard']
		);
	}

	async deleteNote(id: string) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);
				const role = this.requireRole(session);
				const note = await this.repo.findNoteById(id);
				this.ensureCanManageNote(note, userId, role);

				for (const attachment of note.attachments) {
					try {
						await deleteFile(attachment.fileKey);
					} catch (error) {
						console.error('Failed to delete student note attachment', {
							noteId: id,
							attachmentId: attachment.id,
							fileKey: attachment.fileKey,
							error,
						});
					}
				}

				return this.repo.delete(id, {
					userId,
					role,
					activityType: 'student_note_deleted',
					stdNo: note.stdNo,
				});
			},
			['dashboard']
		);
	}

	async uploadAttachment(
		stdNo: number,
		noteId: string,
		file: File,
		fileName: string,
		mimeType: string
	) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);
				const role = this.requireRole(session);
				const note = await this.repo.findNoteById(noteId);
				this.ensureCanManageNote(note, userId, role);

				if (note.stdNo !== stdNo) {
					throw new Error('Note does not belong to student');
				}

				if (file.size > MAX_ATTACHMENT_SIZE) {
					throw new Error('Attachment must not exceed 5 MB');
				}

				if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
					throw new Error('Unsupported attachment type');
				}

				const key = generateUploadKey(
					(name) => StoragePaths.studentNoteAttachment(stdNo, name),
					fileName
				);

				await uploadFile(file, key, mimeType);

				try {
					return await this.repo.createAttachment(
						{
							noteId,
							fileName,
							fileKey: key,
							fileSize: file.size,
							mimeType,
						},
						{
							userId,
							role,
							activityType: 'student_note_attachment_uploaded',
							stdNo,
						}
					);
				} catch (error) {
					try {
						await deleteFile(key);
					} catch (cleanupError) {
						console.error('Failed to rollback student note attachment upload', {
							noteId,
							fileKey: key,
							error: cleanupError,
						});
					}
					throw error;
				}
			},
			['dashboard']
		);
	}

	async deleteAttachment(id: string) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);
				const role = this.requireRole(session);
				const attachment = await this.repo.findAttachmentById(id);
				if (!attachment) {
					throw new Error('Attachment not found');
				}

				const note = await this.repo.findNoteById(attachment.noteId);
				this.ensureCanManageNote(note, userId, role);

				try {
					await deleteFile(attachment.fileKey);
				} catch (error) {
					console.error('Failed to delete student note attachment file', {
						attachmentId: id,
						fileKey: attachment.fileKey,
						error,
					});
				}

				await this.repo.deleteAttachment(id, {
					userId,
					role,
					activityType: 'student_note_attachment_deleted',
					stdNo: note.stdNo,
				});

				return attachment;
			},
			['dashboard']
		);
	}
}

export const studentNotesService = serviceWrapper(
	StudentNotesService,
	'StudentNotesService'
);
