'use client';

import { findAcademicRecordsByApplicant } from '@admissions/applicants/[id]/academic-records/_server/actions';
import {
	Badge,
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
	IconArrowLeft,
	IconArrowRight,
	IconCertificate,
	IconCheck,
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

export default function QualificationsUploadForm({ applicantId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);

	const { data: recordsData } = useQuery({
		queryKey: ['academic-records', applicantId],
		queryFn: () => findAcademicRecordsByApplicant(applicantId),
	});

	const records = recordsData?.items ?? [];
	const hasRecords = records.length > 0;

	async function handleUploadComplete(
		result: DocumentUploadResult<'certificate'>
	) {
		try {
			setUploading(true);
			await uploadCertificateDocument(
				applicantId,
				result.file,
				result.analysis
			);
			await queryClient.invalidateQueries({
				queryKey: ['academic-records', applicantId],
			});
			await queryClient.invalidateQueries({ queryKey: ['applicants'] });
			setUploadKey((prev) => prev + 1);
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
					key={uploadKey}
					type='certificate'
					onUploadComplete={handleUploadComplete}
					disabled={uploading}
					title='Upload Academic Document'
					description='Certificates, transcripts, results - PDF or image, max 10MB'
				/>

				{records.length > 0 && (
					<Stack gap='sm'>
						<Text fw={500} size='sm'>
							Uploaded Qualifications
						</Text>
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
							{records.map((record) => (
								<AcademicRecordCard key={record.id} record={record} />
							))}
						</SimpleGrid>
					</Stack>
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

type AcademicRecord = {
	id: string;
	certificateType?: { name: string; lqfLevel?: number | null } | null;
	institutionName?: string | null;
	examYear?: number | null;
	resultClassification?: string | null;
};

type AcademicRecordCardProps = {
	record: AcademicRecord;
};

function AcademicRecordCard({ record }: AcademicRecordCardProps) {
	return (
		<Card withBorder radius='md' p='md'>
			<Stack gap='sm'>
				<Group wrap='nowrap'>
					<ThemeIcon size='lg' variant='light' color='green'>
						<IconCertificate size={20} />
					</ThemeIcon>
					<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
						<Group gap='xs'>
							<Text size='sm' fw={600} truncate>
								{record.certificateType?.name ?? 'Certificate'}
							</Text>
							{record.certificateType?.lqfLevel && (
								<Badge size='xs' variant='light'>
									LQF {record.certificateType.lqfLevel}
								</Badge>
							)}
						</Group>
						<Group gap={4}>
							<IconCheck size={12} color='var(--mantine-color-green-6)' />
							<Text size='xs' c='green'>
								Verified
							</Text>
						</Group>
					</Stack>
				</Group>
				<Stack gap={4}>
					{record.institutionName && (
						<Group gap='xs'>
							<Text size='xs' c='dimmed' w={80}>
								Institution:
							</Text>
							<Text size='xs' fw={500} style={{ flex: 1 }} truncate>
								{record.institutionName}
							</Text>
						</Group>
					)}
					{record.examYear && (
						<Group gap='xs'>
							<Text size='xs' c='dimmed' w={80}>
								Year:
							</Text>
							<Text size='xs' fw={500}>
								{record.examYear}
							</Text>
						</Group>
					)}
					{record.resultClassification && (
						<Group gap='xs'>
							<Text size='xs' c='dimmed' w={80}>
								Result:
							</Text>
							<Badge size='xs' variant='outline'>
								{record.resultClassification}
							</Badge>
						</Group>
					)}
				</Stack>
			</Stack>
		</Card>
	);
}
