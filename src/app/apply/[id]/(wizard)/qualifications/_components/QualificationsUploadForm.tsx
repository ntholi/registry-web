'use client';

import { findAcademicRecordsByApplicant } from '@admissions/applicants/[id]/academic-records/_server/actions';
import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Group,
	Paper,
	rem,
	SimpleGrid,
	Stack,
	Table,
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
	IconArrowLeft,
	IconArrowRight,
	IconFileTypePdf,
	IconSchool,
	IconTrash,
	IconUpload,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { uploadAcademicDocument } from '../_server/actions';

type Props = {
	applicantId: string;
};

type UploadedDoc = {
	id: string;
	fileName: string;
};

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function QualificationsUploadForm({ applicantId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [pendingDocs, setPendingDocs] = useState<UploadedDoc[]>([]);

	const { data: recordsData } = useQuery({
		queryKey: ['academic-records', applicantId],
		queryFn: () => findAcademicRecordsByApplicant(applicantId),
	});

	const records = recordsData?.items ?? [];
	const hasRecords = records.length > 0 || pendingDocs.length > 0;

	const uploadMutation = useMutation({
		mutationFn: async (file: FileWithPath) => {
			const formData = new FormData();
			formData.append('file', file);
			return uploadAcademicDocument(applicantId, formData);
		},
		onSuccess: ({ fileName }) => {
			setPendingDocs((prev) => [...prev, { id: fileName, fileName }]);
			queryClient.invalidateQueries({
				queryKey: ['academic-records', applicantId],
			});
			queryClient.invalidateQueries({ queryKey: ['applicants'] });
			notifications.show({
				title: 'Document uploaded',
				message: 'Academic document processed successfully',
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
		router.push(`/apply/${applicantId}/program`);
	}

	function handleBack() {
		router.push(`/apply/${applicantId}/documents`);
	}

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>Academic Qualifications</Title>
					<Text c='dimmed' size='sm'>
						Upload your academic certificates, transcripts, or results slips
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
							<IconSchool
								size={52}
								stroke={1.5}
								color='var(--mantine-color-red-6)'
							/>
						</Dropzone.Reject>
						<Dropzone.Idle>
							<IconSchool
								size={52}
								stroke={1.5}
								color='var(--mantine-color-dimmed)'
							/>
						</Dropzone.Idle>

						<Stack gap='xs' ta='center'>
							<Text size='lg' inline>
								Drag academic documents here or click to browse
							</Text>
							<Text size='sm' c='dimmed' inline>
								Certificates, transcripts, results - PDF or image, max 10MB
							</Text>
						</Stack>
					</Group>
				</Dropzone>

				{records.length > 0 && (
					<Stack gap='sm'>
						<Text fw={500}>Extracted Academic Records</Text>
						<Table highlightOnHover withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Certificate</Table.Th>
									<Table.Th>Institution</Table.Th>
									<Table.Th>Year</Table.Th>
									<Table.Th>Classification</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{records.map((record) => (
									<Table.Tr key={record.id}>
										<Table.Td>
											<Group gap='xs'>
												<Text size='sm'>{record.certificateType?.name}</Text>
												{record.certificateType?.lqfLevel && (
													<Badge size='xs' variant='light'>
														LQF {record.certificateType.lqfLevel}
													</Badge>
												)}
											</Group>
										</Table.Td>
										<Table.Td>
											<Text size='sm'>{record.institutionName}</Text>
										</Table.Td>
										<Table.Td>
											<Text size='sm'>{record.examYear}</Text>
										</Table.Td>
										<Table.Td>
											{record.resultClassification && (
												<Badge variant='outline' size='sm'>
													{record.resultClassification}
												</Badge>
											)}
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Stack>
				)}

				{pendingDocs.length > 0 && (
					<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
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
											Processing...
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

				<Group justify='space-between' mt='md'>
					<Button
						variant='subtle'
						leftSection={<IconArrowLeft size={16} />}
						onClick={handleBack}
					>
						Back
					</Button>
					<Button
						rightSection={<IconArrowRight size={16} />}
						onClick={handleContinue}
						disabled={!hasRecords}
					>
						Continue
					</Button>
				</Group>
			</Stack>
		</Paper>
	);
}
