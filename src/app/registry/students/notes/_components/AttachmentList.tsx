'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AttachmentManager } from '@/shared/ui/adease';
import { ALLOWED_MIME_TYPES, MAX_ATTACHMENT_SIZE } from '../_lib/constants';
import { deleteNoteAttachment, uploadNoteAttachment } from '../_server/actions';
import type { StudentNoteAttachmentRecord } from '../_server/repository';

type Props = {
	noteId: string;
	stdNo: number;
	attachments: StudentNoteAttachmentRecord[];
	canEdit: boolean;
};

export default function AttachmentList({
	noteId,
	stdNo,
	attachments,
	canEdit,
}: Props) {
	const queryClient = useQueryClient();

	async function refreshNotes() {
		await queryClient.invalidateQueries({
			queryKey: ['student-notes', stdNo],
		});
	}

	return (
		<AttachmentManager
			attachments={attachments}
			canEdit={canEdit}
			accept={ALLOWED_MIME_TYPES}
			maxSize={MAX_ATTACHMENT_SIZE}
			onUpload={async (file) => {
				const formData = new FormData();
				formData.append('file', file);
				return uploadNoteAttachment(stdNo, noteId, formData);
			}}
			onDelete={deleteNoteAttachment}
			onChange={refreshNotes}
		/>
	);
}
