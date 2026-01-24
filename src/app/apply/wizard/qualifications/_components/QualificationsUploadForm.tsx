'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Divider,
	Group,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCertificate, IconTrash } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { getGradeColor } from '@/app/admissions/applicants/[id]/_components/AcademicRecordsTab';
import {
	DocumentUpload,
	type DocumentUploadResult,
} from '@/shared/ui/DocumentUpload';
import WizardNavigation from '../../_components/WizardNavigation';
import {
	removeAcademicRecord,
	uploadCertificateDocument,
} from '../_server/actions';

export default function QualificationsUploadForm() {
	const router = useRouter();
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);

	const { applicant, refetch } = useApplicant();
	const applicantId = applicant?.id ?? '';

	const records = applicant?.academicRecords ?? [];
	const hasRecords = records.length > 0;

	const deleteMutation = useMutation({
		mutationFn: removeAcademicRecord,
		onSuccess: () => {
			refetch();
			notifications.show({
				title: 'Record removed',
				message: 'Academic record has been deleted',
				color: 'green',
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Delete failed',
				message: error instanceof Error ? error.message : 'Failed to delete',
				color: 'red',
			});
		},
	});

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
			await refetch();
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

	function handleDelete(id: string) {
		deleteMutation.mutate(id);
	}

	function handleContinue() {
		router.push('/apply/wizard/program');
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
								<AcademicRecordCard
									key={record.id}
									record={record}
									onDelete={() => handleDelete(record.id)}
									deleting={deleteMutation.isPending}
								/>
							))}
						</SimpleGrid>
					</Stack>
				)}

				<WizardNavigation
					backPath='/apply/wizard/documents'
					onNext={handleContinue}
					nextDisabled={!hasRecords}
				/>
			</Stack>
		</Paper>
	);
}

type SubjectGrade = {
	id: string;
	originalGrade: string;
	standardGrade: string;
	subject: { id: string; name: string };
};

type AcademicRecord = {
	id: string;
	certificateType?: { name: string; lqfLevel?: number | null } | null;
	institutionName?: string | null;
	examYear?: number | null;
	resultClassification?: string | null;
	qualificationName?: string | null;
	certificateNumber?: string | null;
	subjectGrades?: SubjectGrade[];
};

type AcademicRecordCardProps = {
	record: AcademicRecord;
	onDelete: () => void;
	deleting: boolean;
};

function AcademicRecordCard({
	record,
	onDelete,
	deleting,
}: AcademicRecordCardProps) {
	const [deleteOpened, { open: openDelete, close: closeDelete }] =
		useDisclosure(false);
	const [detailsOpened, { open: openDetails, close: closeDetails }] =
		useDisclosure(false);

	function handleConfirmDelete() {
		onDelete();
		closeDelete();
	}

	const hasSubjects = record.subjectGrades && record.subjectGrades.length > 0;

	return (
		<>
			<Modal
				opened={deleteOpened}
				onClose={closeDelete}
				title='Delete Record'
				centered
			>
				<Stack gap='md'>
					<Text size='sm'>
						Are you sure you want to delete this academic record? This action
						cannot be undone.
					</Text>
					<Group justify='flex-end'>
						<Button variant='subtle' onClick={closeDelete}>
							Cancel
						</Button>
						<Button
							color='red'
							onClick={handleConfirmDelete}
							loading={deleting}
						>
							Delete
						</Button>
					</Group>
				</Stack>
			</Modal>

			<QualificationDetailsModal
				record={record}
				opened={detailsOpened}
				onClose={closeDetails}
			/>

			<Card
				withBorder
				radius='md'
				p='md'
				style={{ cursor: 'pointer' }}
				onClick={openDetails}
			>
				<Stack gap='sm'>
					<Group wrap='nowrap' justify='space-between'>
						<Group wrap='nowrap'>
							<ThemeIcon size='lg' variant='light' color='green'>
								<IconCertificate size={20} />
							</ThemeIcon>
							<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
								<Group gap='xs'>
									<Text size='sm' fw={600} truncate>
										{record.certificateType?.name ?? 'Certificate'}
									</Text>
								</Group>
							</Stack>
						</Group>
						<ActionIcon
							variant='subtle'
							color='red'
							onClick={(e) => {
								e.stopPropagation();
								openDelete();
							}}
							disabled={deleting}
						>
							<IconTrash size={16} />
						</ActionIcon>
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
						{hasSubjects && (
							<Group gap='xs'>
								<Box w={80} />
								<Text size='xs' c='dimmed' fs={'italic'} mt={4}>
									{record.subjectGrades?.length}{' '}
									{record.subjectGrades?.length === 1 ? 'subject' : 'subjects'}{' '}
									Found, tap to view
								</Text>
							</Group>
						)}
					</Stack>
				</Stack>
			</Card>
		</>
	);
}

type QualificationDetailsModalProps = {
	record: AcademicRecord;
	opened: boolean;
	onClose: () => void;
};

function QualificationDetailsModal({
	record,
	opened,
	onClose,
}: QualificationDetailsModalProps) {
	const hasSubjects = record.subjectGrades && record.subjectGrades.length > 0;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Qualification Details'
			size='lg'
			centered
		>
			<Stack gap='md'>
				<Group gap='sm'>
					<ThemeIcon size='xl' variant='light' color='green'>
						<IconCertificate size={24} />
					</ThemeIcon>
					<Stack gap={2} justify='start'>
						<Text fw={600}>
							{record.certificateType?.name ?? 'Certificate'}
						</Text>
						{record.resultClassification && (
							<Badge size='xs' variant='light'>
								{record.resultClassification}
							</Badge>
						)}
					</Stack>
				</Group>

				<Group justify={'space-between'} wrap='nowrap'>
					{record.institutionName && (
						<Stack gap={2}>
							<Text size='xs' c='dimmed'>
								Institution
							</Text>
							<Text size='sm' fw={500}>
								{record.institutionName}
							</Text>
						</Stack>
					)}
					{record.examYear && (
						<Stack gap={2}>
							<Text size='xs' c='dimmed' ta={'right'}>
								Year
							</Text>
							<Text size='sm' fw={500}>
								{record.examYear}
							</Text>
						</Stack>
					)}
				</Group>
				<Group justify={'space-between'} wrap='nowrap'>
					{record.qualificationName && (
						<Stack gap={2}>
							<Text size='xs' c='dimmed'>
								Qualification
							</Text>
							<Text size='sm' fw={500}>
								{record.qualificationName}
							</Text>
						</Stack>
					)}
					{record.certificateNumber && (
						<Stack gap={2}>
							<Text size='xs' c='dimmed' ta={'right'}>
								Cert No.
							</Text>
							<Text size='sm' fw={500}>
								{record.certificateNumber}
							</Text>
						</Stack>
					)}
				</Group>

				{hasSubjects && (
					<>
						<Divider />
						<Stack gap='xs'>
							<Text fw={500} size='sm'>
								Subjects & Grades
							</Text>
							<Table highlightOnHover withTableBorder>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Subject</Table.Th>
										<Table.Th w={80} ta='center'>
											Grade
										</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{record.subjectGrades?.map((sg) => (
										<Table.Tr key={sg.id}>
											<Table.Td>
												<Text size='sm'>{sg.subject.name}</Text>
											</Table.Td>
											<Table.Td ta='center'>
												<Badge
													size='sm'
													variant='light'
													color={getGradeColor(sg.standardGrade)}
												>
													{sg.standardGrade}
												</Badge>
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</Stack>
					</>
				)}

				<Group justify='flex-end'>
					<Button variant='subtle' onClick={onClose}>
						Close
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
