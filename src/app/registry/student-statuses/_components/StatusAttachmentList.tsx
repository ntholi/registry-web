'use client';

import { useRouter } from 'next/navigation';
import { AttachmentManager } from '@/shared/ui/adease';
import { ALLOWED_MIME_TYPES, MAX_ATTACHMENT_SIZE } from '../_lib/constants';
import type { getStudentStatus } from '../_server/actions';
import {
	deleteStudentStatusAttachment,
	uploadStudentStatusAttachment,
} from '../_server/actions';

type StatusAttachment = NonNullable<
	NonNullable<Awaited<ReturnType<typeof getStudentStatus>>>['attachments']
>[number];

type Props = {
	applicationId: string;
	attachments: StatusAttachment[];
	canEdit: boolean;
};

export default function StatusAttachmentList({
	applicationId,
	attachments,
	canEdit,
}: Props) {
	const router = useRouter();

	return (
		<AttachmentManager
			attachments={attachments}
			canEdit={canEdit}
			accept={ALLOWED_MIME_TYPES}
			maxSize={MAX_ATTACHMENT_SIZE}
			onUpload={async (file) => {
				const formData = new FormData();
				formData.append('file', file);
				return uploadStudentStatusAttachment(applicationId, formData);
			}}
			onDelete={deleteStudentStatusAttachment}
			onChange={() => router.refresh()}
		/>
	);
}
