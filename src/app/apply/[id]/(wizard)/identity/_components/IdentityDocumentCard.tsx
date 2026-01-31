'use client';

import { Stack } from '@mantine/core';
import { IconId } from '@tabler/icons-react';
import {
	DocumentCardShell,
	DocumentDetailRow,
} from '@/shared/ui/DocumentCardShell';

export type UploadedIdentityDoc = {
	id: string;
	fileUrl?: string | null;
	fullName?: string | null;
	nationalId?: string | null;
	dateOfBirth?: string | null;
	nationality?: string | null;
	documentType?: string | null;
};

type Props = {
	doc: UploadedIdentityDoc;
	onDelete: () => Promise<void>;
	deleting?: boolean;
	canDelete?: boolean;
};

export function IdentityDocumentCard({
	doc,
	onDelete,
	deleting,
	canDelete = true,
}: Props) {
	return (
		<DocumentCardShell
			icon={<IconId size={20} />}
			title='Identity Document'
			onDelete={onDelete}
			deleting={deleting}
			canDelete={canDelete}
			deleteMessage='Are you sure you want to delete this identity document? This action cannot be undone.'
		>
			<Stack gap={4}>
				<DocumentDetailRow label='Name' value={doc.fullName} />
				<DocumentDetailRow label='ID Number' value={doc.nationalId} />
				<DocumentDetailRow label='DOB' value={doc.dateOfBirth} />
				<DocumentDetailRow label='Nationality' value={doc.nationality} />
			</Stack>
		</DocumentCardShell>
	);
}
