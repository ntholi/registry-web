'use client';

import {
	Button,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { documentTypeEnum } from '@registry/_database';
import { IconFile, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { DocumentCard } from '../documents/_components/DocumentCard';
import { DocumentPreviewModal } from '../documents/_components/DocumentPreviewModal';
import { UploadModal } from '../documents/_components/UploadModal';
import type { ApplicantDocument } from '../documents/_lib/types';

type Props = {
	applicantId: string;
	documents: ApplicantDocument[];
};

export default function DocumentsTab({ applicantId, documents }: Props) {
	const [uploadOpened, { open: openUpload, close: closeUpload }] =
		useDisclosure(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewOpened, { open: openPreview, close: closePreview }] =
		useDisclosure(false);

	const groupedDocs = documentTypeEnum.enumValues.reduce(
		(acc, type) => {
			const docs = documents.filter((d) => d.document.type === type);
			if (docs.length > 0) {
				acc[type] = docs;
			}
			return acc;
		},
		{} as Record<string, ApplicantDocument[]>
	);

	const hasDocuments = Object.keys(groupedDocs).length > 0;

	function handlePreview(url: string) {
		setPreviewUrl(url);
		openPreview();
	}

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Stack gap={2}>
					<Text fw={500}>Documents</Text>
					<Text size='xs' c='dimmed'>
						Identity documents, certificates, and supporting files
					</Text>
				</Stack>
				<Button
					variant='light'
					size='xs'
					leftSection={<IconPlus size={16} />}
					onClick={openUpload}
				>
					Add Document
				</Button>
			</Group>

			{!hasDocuments && (
				<Paper withBorder p='xl'>
					<Stack align='center' gap='xs'>
						<ThemeIcon size={60} variant='light' color='gray'>
							<IconFile size={30} />
						</ThemeIcon>
						<Text c='dimmed' size='sm'>
							No documents uploaded
						</Text>
					</Stack>
				</Paper>
			)}

			{Object.entries(groupedDocs).map(([type, docs]) => (
				<Stack key={type} gap='xs'>
					<Text size='sm' fw={500} c='dimmed' tt='capitalize'>
						{type.replace(/_/g, ' ')}
					</Text>
					<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
						{docs.map((doc) => (
							<DocumentCard key={doc.id} doc={doc} onPreview={handlePreview} />
						))}
					</SimpleGrid>
				</Stack>
			))}

			<UploadModal
				opened={uploadOpened}
				onClose={closeUpload}
				applicantId={applicantId}
			/>

			<DocumentPreviewModal
				opened={previewOpened}
				onClose={closePreview}
				previewUrl={previewUrl}
			/>
		</Stack>
	);
}
