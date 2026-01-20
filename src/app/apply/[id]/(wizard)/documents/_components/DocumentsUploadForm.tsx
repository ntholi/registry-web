'use client';

import { findDocumentsByApplicant } from '@admissions/applicants/[id]/documents/_server/actions';
import {
	ActionIcon,
	Button,
	Card,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconArrowRight,
	IconCheck,
	IconFileTypePdf,
	IconTrash,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import {
	DocumentUpload,
	type DocumentUploadResult,
} from '@/shared/ui/DocumentUpload';
import { uploadIdentityDocument } from '../_server/actions';

type Props = {
	applicantId: string;
};

type UploadedDoc = {
	id: string;
	fileName: string;
};

export default function DocumentsUploadForm({ applicantId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [pendingDocs, setPendingDocs] = useState<UploadedDoc[]>([]);
	const [uploading, setUploading] = useState(false);

	const { data: existingDocs } = useQuery({
		queryKey: ['applicant-documents', applicantId],
		queryFn: () => findDocumentsByApplicant(applicantId),
	});

	const identityDocs =
		existingDocs?.items.filter((d) => d.document.type === 'identity') ?? [];
	const hasIdentity = identityDocs.length > 0 || pendingDocs.length > 0;

	async function handleUploadComplete(
		result: DocumentUploadResult<'identity'>
	) {
		try {
			setUploading(true);
			const { fileName } = await uploadIdentityDocument(
				applicantId,
				result.file,
				result.analysis
			);
			setPendingDocs((prev) => [...prev, { id: fileName, fileName }]);
			queryClient.invalidateQueries({
				queryKey: ['applicant-documents', applicantId],
			});
			notifications.show({
				title: 'Document uploaded',
				message: 'Identity document processed successfully',
				color: 'green',
			});
		} catch (error) {
			notifications.show({
				title: 'Upload failed',
				message: error instanceof Error ? error.message : 'Upload failed',
				color: 'red',
			});
		} finally {
			setUploading(false);
		}
	}

	function handleRemove(id: string) {
		setPendingDocs((prev) => prev.filter((d) => d.id !== id));
	}

	function handleContinue() {
		router.push(`/apply/${applicantId}/qualifications`);
	}

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>Identity Documents</Title>
					<Text c='dimmed' size='sm'>
						Upload your national ID, passport, or other identity document
					</Text>
				</Stack>

				<DocumentUpload
					type='identity'
					onUploadComplete={handleUploadComplete}
					disabled={uploading}
					title='Upload Identity Document'
					description='National ID, passport, or birth certificate'
				/>

				{(identityDocs.length > 0 || pendingDocs.length > 0) && (
					<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
						{identityDocs.map((doc) => (
							<Card key={doc.id} withBorder radius='md' p='sm'>
								<Group wrap='nowrap'>
									<ThemeIcon size='lg' variant='light' color='green'>
										<IconCheck size={20} />
									</ThemeIcon>
									<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
										<Text size='sm' fw={500} truncate>
											{doc.document.type}
										</Text>
										<Text size='xs' c='dimmed' truncate>
											Uploaded
										</Text>
									</Stack>
								</Group>
							</Card>
						))}
						{pendingDocs.map((doc) => (
							<Card key={doc.id} withBorder radius='md' p='sm'>
								<Group wrap='nowrap'>
									<ThemeIcon size='lg' variant='light' color='blue'>
										<IconFileTypePdf size={20} />
									</ThemeIcon>
									<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
										<Text size='sm' fw={500} truncate>
											{doc.fileName}
										</Text>
										<Text size='xs' c='dimmed'>
											Just uploaded
										</Text>
									</Stack>
									<ActionIcon
										variant='subtle'
										color='red'
										onClick={() => handleRemove(doc.id)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								</Group>
							</Card>
						))}
					</SimpleGrid>
				)}

				<Group justify='flex-end' mt='md'>
					<Button
						rightSection={<IconArrowRight size={16} />}
						onClick={handleContinue}
						disabled={!hasIdentity}
					>
						Continue
					</Button>
				</Group>
			</Stack>
		</Paper>
	);
}
