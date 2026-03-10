import { and, count, desc, eq, or, sql } from 'drizzle-orm';
import type { UserRole } from '@/core/database';
import {
	db,
	studentNoteAttachments,
	studentNotes,
	students,
	users,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

interface StudentNoteCreator {
	id: string | null;
	name: string | null;
}

interface StudentNoteAttachmentRecord {
	id: string;
	noteId: string;
	fileName: string;
	fileKey: string;
	fileSize: number | null;
	mimeType: string | null;
	createdAt: Date;
}

type StudentNoteRecord = typeof studentNotes.$inferSelect & {
	createdByUser: StudentNoteCreator;
	attachments: StudentNoteAttachmentRecord[];
};

interface StudentNoteRow {
	note: typeof studentNotes.$inferSelect;
	creatorId: string | null;
	creatorName: string | null;
	attachmentId: string | null;
	attachmentNoteId: string | null;
	attachmentFileName: string | null;
	attachmentFileKey: string | null;
	attachmentFileSize: number | null;
	attachmentMimeType: string | null;
	attachmentCreatedAt: Date | null;
}

export type { StudentNoteAttachmentRecord, StudentNoteRecord };

export default class StudentNotesRepository extends BaseRepository<
	typeof studentNotes,
	'id'
> {
	constructor() {
		super(studentNotes, studentNotes.id);
	}

	private mapNotes(rows: StudentNoteRow[]): StudentNoteRecord[] {
		const notes = new Map<string, StudentNoteRecord>();

		for (const row of rows) {
			const existing = notes.get(row.note.id);
			if (!existing) {
				notes.set(row.note.id, {
					...row.note,
					createdByUser: {
						id: row.creatorId,
						name: row.creatorName,
					},
					attachments: [],
				});
			}

			const note = notes.get(row.note.id);
			if (
				note &&
				row.attachmentId &&
				row.attachmentNoteId &&
				row.attachmentFileName &&
				row.attachmentFileKey &&
				row.attachmentCreatedAt
			) {
				note.attachments.push({
					id: row.attachmentId,
					noteId: row.attachmentNoteId,
					fileName: row.attachmentFileName,
					fileKey: row.attachmentFileKey,
					fileSize: row.attachmentFileSize,
					mimeType: row.attachmentMimeType,
					createdAt: row.attachmentCreatedAt,
				});
			}
		}

		return Array.from(notes.values());
	}

	async findByStudent(stdNo: number, userId: string, userRole: UserRole) {
		const visibilityFilter =
			userRole === 'admin'
				? eq(studentNotes.stdNo, stdNo)
				: and(
						eq(studentNotes.stdNo, stdNo),
						or(
							eq(studentNotes.visibility, 'everyone'),
							and(
								eq(studentNotes.visibility, 'role'),
								eq(studentNotes.creatorRole, userRole)
							),
							and(
								eq(studentNotes.visibility, 'self'),
								eq(studentNotes.createdBy, userId)
							)
						)
					);

		const rows = await db
			.select({
				note: studentNotes,
				creatorId: users.id,
				creatorName: users.name,
				attachmentId: studentNoteAttachments.id,
				attachmentNoteId: studentNoteAttachments.noteId,
				attachmentFileName: studentNoteAttachments.fileName,
				attachmentFileKey: studentNoteAttachments.fileKey,
				attachmentFileSize: studentNoteAttachments.fileSize,
				attachmentMimeType: studentNoteAttachments.mimeType,
				attachmentCreatedAt: studentNoteAttachments.createdAt,
			})
			.from(studentNotes)
			.leftJoin(users, eq(studentNotes.createdBy, users.id))
			.leftJoin(
				studentNoteAttachments,
				eq(studentNoteAttachments.noteId, studentNotes.id)
			)
			.where(visibilityFilter)
			.orderBy(
				desc(studentNotes.createdAt),
				desc(studentNoteAttachments.createdAt)
			);

		return this.mapNotes(rows);
	}

	async findAllNotes(
		userId: string,
		userRole: UserRole,
		page: number,
		search?: string
	) {
		const size = 15;
		const offset = (page - 1) * size;

		const visibilityCondition =
			userRole === 'admin'
				? undefined
				: or(
						eq(studentNotes.visibility, 'everyone'),
						and(
							eq(studentNotes.visibility, 'role'),
							eq(studentNotes.creatorRole, userRole)
						),
						and(
							eq(studentNotes.visibility, 'self'),
							eq(studentNotes.createdBy, userId)
						)
					);

		const searchCondition = search
			? or(
					sql`${students.name} ILIKE ${`%${search}%`}`,
					sql`${studentNotes.stdNo}::text ILIKE ${`%${search}%`}`,
					sql`${studentNotes.content} ILIKE ${`%${search}%`}`
				)
			: undefined;

		const conditions = [visibilityCondition, searchCondition].filter(Boolean);
		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const items = await db
			.select({
				id: studentNotes.id,
				stdNo: studentNotes.stdNo,
				content: studentNotes.content,
				visibility: studentNotes.visibility,
				creatorRole: studentNotes.creatorRole,
				createdBy: studentNotes.createdBy,
				createdAt: studentNotes.createdAt,
				updatedAt: studentNotes.updatedAt,
				studentName: students.name,
			})
			.from(studentNotes)
			.innerJoin(students, eq(studentNotes.stdNo, students.stdNo))
			.where(where)
			.orderBy(desc(studentNotes.createdAt))
			.limit(size)
			.offset(offset);

		const [result] = await db
			.select({ count: count() })
			.from(studentNotes)
			.innerJoin(students, eq(studentNotes.stdNo, students.stdNo))
			.where(where);

		const totalItems = result?.count ?? 0;
		return {
			items,
			totalPages: Math.ceil(totalItems / size),
			totalItems,
		};
	}

	async findNoteById(id: string) {
		const rows = await db
			.select({
				note: studentNotes,
				creatorId: users.id,
				creatorName: users.name,
				attachmentId: studentNoteAttachments.id,
				attachmentNoteId: studentNoteAttachments.noteId,
				attachmentFileName: studentNoteAttachments.fileName,
				attachmentFileKey: studentNoteAttachments.fileKey,
				attachmentFileSize: studentNoteAttachments.fileSize,
				attachmentMimeType: studentNoteAttachments.mimeType,
				attachmentCreatedAt: studentNoteAttachments.createdAt,
			})
			.from(studentNotes)
			.leftJoin(users, eq(studentNotes.createdBy, users.id))
			.leftJoin(
				studentNoteAttachments,
				eq(studentNoteAttachments.noteId, studentNotes.id)
			)
			.where(eq(studentNotes.id, id))
			.orderBy(desc(studentNoteAttachments.createdAt));

		return this.mapNotes(rows)[0] ?? null;
	}

	async createAttachment(
		data: typeof studentNoteAttachments.$inferInsert,
		audit?: AuditOptions
	) {
		if (!audit) {
			const [attachment] = await db
				.insert(studentNoteAttachments)
				.values(data)
				.returning();
			return attachment;
		}

		return db.transaction(async (tx) => {
			const [attachment] = await tx
				.insert(studentNoteAttachments)
				.values(data)
				.returning();

			await this.writeAuditLogForTable(
				tx,
				'student_note_attachments',
				'INSERT',
				attachment.id,
				null,
				attachment,
				audit
			);

			return attachment;
		});
	}

	async deleteAttachments(noteId: string) {
		await db
			.delete(studentNoteAttachments)
			.where(eq(studentNoteAttachments.noteId, noteId));
	}

	async findAttachmentById(id: string) {
		return db.query.studentNoteAttachments.findFirst({
			where: eq(studentNoteAttachments.id, id),
		});
	}

	async deleteAttachment(id: string, audit?: AuditOptions) {
		if (!audit) {
			await db
				.delete(studentNoteAttachments)
				.where(eq(studentNoteAttachments.id, id));
			return;
		}

		await db.transaction(async (tx) => {
			const existing = await tx.query.studentNoteAttachments.findFirst({
				where: eq(studentNoteAttachments.id, id),
			});

			if (!existing) {
				return;
			}

			await tx
				.delete(studentNoteAttachments)
				.where(eq(studentNoteAttachments.id, id));

			await this.writeAuditLogForTable(
				tx,
				'student_note_attachments',
				'DELETE',
				id,
				existing,
				null,
				audit
			);
		});
	}
}

export const studentNotesRepository = new StudentNotesRepository();
