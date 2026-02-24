'use client';

import { Box, Group, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'nextjs-toploader/app';
import { DeleteButton } from '@/shared/ui/adease/DeleteButton';
import type { ApplicantDocument } from '../_lib/types';
import { deleteApplicantDocument } from '../_server/actions';
import { DocumentCard } from './DocumentCard';

type Props = {
	doc: ApplicantDocument;
	onPreview: () => void;
};

export function DocumentCardWithActions({ doc, onPreview }: Props) {
	const router = useRouter();
	const previewUrl = doc.document.fileUrl ?? '';

	async function handleDelete() {
		await deleteApplicantDocument(doc.id, previewUrl);
	}

	function handleDeleteSuccess() {
		notifications.show({
			title: 'Success',
			message: 'Document deleted',
			color: 'green',
		});
		router.refresh();
	}

	return (
		<Box pos='relative'>
			<Paper
				pos='absolute'
				top={0}
				left={0}
				right={0}
				p={3}
				style={{ zIndex: 2, background: 'rgba(31, 31, 31, 0.3)' }}
			>
				<Group justify='flex-end' style={{ pointerEvents: 'auto' }}>
					<DeleteButton
						handleDelete={handleDelete}
						onSuccess={handleDeleteSuccess}
						itemType='document'
						itemName={doc.document.fileName ?? undefined}
						warningMessage='This will permanently delete this document. If it is linked to an academic record, that related academic record will also be deleted. This action cannot be undone.'
						confirmButtonText='Delete Document'
						typedConfirmation={false}
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
						}}
					/>
				</Group>
			</Paper>

			<DocumentCard doc={doc} onPreview={onPreview} />
		</Box>
	);
}
