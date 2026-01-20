'use client';

import { findDocumentsByApplicant } from '@admissions/applicants/[id]/documents/_server/actions';
import {
	ActionIcon,
	Button,
	Card,
	Group,
	Paper,
	rem,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	Dropzone,
	type FileRejection,
	type FileWithPath,
	IMAGE_MIME_TYPE,
	MIME_TYPES,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import {
	IconArrowRight,
	IconCheck,
	IconFileTypePdf,
	IconId,
	IconPhoto,
	IconTrash,
	IconUpload,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { uploadAcademicDocument } from '../../qualifications/_server/actions';

type Props = {
	applicantId: string;
};

type UploadedDoc = {
	id: string;
	fileName: string;
	preview?: string;
};

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function DocumentsUploadForm({ applicantId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [pendingDocs, setPendingDocs] = useState<UploadedDoc[]>([]);

	const { data: existingDocs } = useQuery({
		queryKey: ['applicant-documents', applicantId],
		queryFn: () => findDocumentsByApplicant(applicantId),
	});

	const identityDocs =
		existingDocs?.items.filter((d) => d.document.type === 'identity') ?? [];
	const hasIdentity = identityDocs.length > 0 || pendingDocs.length > 0;

	const uploadMutation = useMutation({
		mutationFn: async (file: FileWithPath) => {
			const formData = new FormData();
			formData.append('file', file);
			return uploadAcademicDocument(applicantId, formData);
		},
		onSuccess: ({ fileName }) => {
			setPendingDocs((prev) => [...prev, { id: fileName, fileName }]);
			queryClient.invalidateQueries({
				queryKey: ['applicant-documents', applicantId],
			});
			notifications.show({
				title: 'Document uploaded',
				message: 'Identity document processed successfully',
				color: 'green',
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Upload failed',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleDrop(files: FileWithPath[]) {
		for (const file of files) {
			uploadMutation.mutate(file);
		}
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File rejected',
			message: 'Please upload PDF or image files under 10MB',
			color: 'red',
		});
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

				<Dropzone
					onDrop={handleDrop}
					onReject={handleReject}
					maxSize={MAX_FILE_SIZE}
					accept={ACCEPTED_MIME_TYPES}
					loading={uploadMutation.isPending}
				>
					<Group
						justify='center'
						gap='xl'
						mih={rem(140)}
						style={{ pointerEvents: 'none' }}
					>
						<Dropzone.Accept>
							<IconUpload
								size={52}
								stroke={1.5}
								color='var(--mantine-color-blue-6)'
							/>
						</Dropzone.Accept>
						<Dropzone.Reject>
							<IconPhoto
								size={52}
								stroke={1.5}
								color='var(--mantine-color-red-6)'
							/>
						</Dropzone.Reject>
						<Dropzone.Idle>
							<IconId
								size={52}
								stroke={1.5}
								color='var(--mantine-color-dimmed)'
							/>
						</Dropzone.Idle>

						<Stack gap='xs' ta='center'>
							<Text size='lg' inline>
								Drag identity document here or click to browse
							</Text>
							<Text size='sm' c='dimmed' inline>
								PDF or image files, max 10MB
							</Text>
						</Stack>
					</Group>
				</Dropzone>

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
