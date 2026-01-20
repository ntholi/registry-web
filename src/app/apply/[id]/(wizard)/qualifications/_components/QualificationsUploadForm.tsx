'use client';

import { findAcademicRecordsByApplicant } from '@admissions/applicants/[id]/academic-records/_server/actions';
import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconArrowLeft,
	IconArrowRight,
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
import { uploadCertificateDocument } from '../_server/actions';

type Props = {
	applicantId: string;
};

type UploadedDoc = {
	id: string;
	fileName: string;
};

export default function QualificationsUploadForm({ applicantId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [pendingDocs, setPendingDocs] = useState<UploadedDoc[]>([]);
	const [uploading, setUploading] = useState(false);

	const { data: recordsData } = useQuery({
		queryKey: ['academic-records', applicantId],
		queryFn: () => findAcademicRecordsByApplicant(applicantId),
	});

	const records = recordsData?.items ?? [];
	const hasRecords = records.length > 0 || pendingDocs.length > 0;

	async function handleUploadComplete(
		result: DocumentUploadResult<'certificate'>
	) {
		try {
			setUploading(true);
			const { fileName } = await uploadCertificateDocument(
				applicantId,
				result.file,
				result.analysis
			);
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

				<DocumentUpload
					type='certificate'
					onUploadComplete={handleUploadComplete}
					disabled={uploading}
					title='Upload Academic Document'
					description='Certificates, transcripts, results - PDF or image, max 10MB'
				/>

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
