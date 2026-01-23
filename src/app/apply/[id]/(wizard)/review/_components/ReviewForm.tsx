'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import {
	Badge,
	Box,
	Button,
	Card,
	Divider,
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
	IconCheck,
	IconEdit,
	IconFile,
	IconSchool,
	IconSend,
	IconUser,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { submitApplication } from '../_server/actions';

type Application = {
	id: string;
	firstChoiceProgram?: {
		name: string;
		code: string;
		school?: { shortName: string | null } | null;
	} | null;
	secondChoiceProgram?: {
		name: string;
		code: string;
		school?: { shortName: string | null } | null;
	} | null;
	intakePeriod?: { name: string } | null;
	status: string;
};

type Props = {
	applicantId: string;
	applicant: ApplicantWithRelations;
	application?: Application | null;
};

export default function ReviewForm({
	applicantId,
	applicant,
	application,
}: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const submitMutation = useMutation({
		mutationFn: async () => {
			if (!application?.id) {
				throw new Error('No application found');
			}
			return submitApplication(application.id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			notifications.show({
				title: 'Application submitted!',
				message: 'Your application has been submitted for review',
				color: 'green',
			});
			router.push('/apply');
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleBack() {
		router.push(`/apply/${applicantId}/personal-info`);
	}

	function handleEdit(step: string) {
		router.push(`/apply/${applicantId}/${step}`);
	}

	function handleSubmit() {
		submitMutation.mutate();
	}

	const hasDocuments = applicant.documents?.length > 0;
	const hasRecords = applicant.academicRecords?.length > 0;

	return (
		<Stack gap='lg'>
			<Paper withBorder radius='md' p='lg'>
				<Stack gap='lg'>
					<Group justify='space-between'>
						<Group gap='sm'>
							<ThemeIcon size='lg' variant='light'>
								<IconUser size={20} />
							</ThemeIcon>
							<Title order={4}>Personal Information</Title>
						</Group>
						<Button
							variant='subtle'
							size='xs'
							leftSection={<IconEdit size={14} />}
							onClick={() => handleEdit('profile')}
						>
							Edit
						</Button>
					</Group>

					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='sm'>
						<Stack gap={4}>
							<Text size='xs' c='dimmed'>
								Full Name
							</Text>
							<Text size='sm' fw={500}>
								{applicant.fullName}
							</Text>
						</Stack>
						<Stack gap={4}>
							<Text size='xs' c='dimmed'>
								Date of Birth
							</Text>
							<Text size='sm'>{applicant.dateOfBirth ?? '-'}</Text>
						</Stack>
						<Stack gap={4}>
							<Text size='xs' c='dimmed'>
								National ID
							</Text>
							<Text size='sm'>{applicant.nationalId ?? '-'}</Text>
						</Stack>
						<Stack gap={4}>
							<Text size='xs' c='dimmed'>
								Nationality
							</Text>
							<Text size='sm'>{applicant.nationality ?? '-'}</Text>
						</Stack>
						<Stack gap={4}>
							<Text size='xs' c='dimmed'>
								Gender
							</Text>
							<Text size='sm'>{applicant.gender ?? '-'}</Text>
						</Stack>
						<Stack gap={4}>
							<Text size='xs' c='dimmed'>
								Address
							</Text>
							<Text size='sm'>{applicant.address ?? '-'}</Text>
						</Stack>
					</SimpleGrid>
				</Stack>
			</Paper>

			<Paper withBorder radius='md' p='lg'>
				<Stack gap='lg'>
					<Group justify='space-between'>
						<Group gap='sm'>
							<ThemeIcon size='lg' variant='light'>
								<IconSchool size={20} />
							</ThemeIcon>
							<Title order={4}>Program Selection</Title>
						</Group>
						<Button
							variant='subtle'
							size='xs'
							leftSection={<IconEdit size={14} />}
							onClick={() => handleEdit('program')}
						>
							Edit
						</Button>
					</Group>

					{application ? (
						<Stack gap='md'>
							<Card withBorder radius='md' p='sm'>
								<Box>
									<Text size='xs'>First Choice</Text>
									<Group>
										<Text size='sm' fw={500}>
											{application.firstChoiceProgram?.name}
										</Text>
										{application.firstChoiceProgram?.school?.shortName && (
											<Badge size='xs' variant='default'>
												{application.firstChoiceProgram.school.shortName}
											</Badge>
										)}
									</Group>
								</Box>
							</Card>

							{application.secondChoiceProgram && (
								<Card withBorder radius='md' p='sm'>
									<Box>
										<Text size='xs'>Second Choice</Text>
										<Group>
											<Text size='sm' fw={500}>
												{application.secondChoiceProgram.name}
											</Text>
											{application.secondChoiceProgram.school?.shortName && (
												<Badge size='xs' variant='default'>
													{application.secondChoiceProgram.school.shortName}
												</Badge>
											)}
										</Group>
									</Box>
								</Card>
							)}
						</Stack>
					) : (
						<Text c='dimmed' size='sm'>
							No program selected
						</Text>
					)}
				</Stack>
			</Paper>

			<Paper withBorder radius='md' p='lg'>
				<Stack gap='lg'>
					<Group justify='space-between'>
						<Group gap='sm'>
							<ThemeIcon size='lg' variant='light'>
								<IconFile size={20} />
							</ThemeIcon>
							<Title order={4}>Documents</Title>
						</Group>
						<Button
							variant='subtle'
							size='xs'
							leftSection={<IconEdit size={14} />}
							onClick={() => handleEdit('documents')}
						>
							Edit
						</Button>
					</Group>

					{hasDocuments ? (
						<Group gap='xs'>
							<ThemeIcon size='sm' variant='light' color='green'>
								<IconCheck size={14} />
							</ThemeIcon>
							<Text size='sm'>
								{applicant.documents.length} document(s) uploaded
							</Text>
						</Group>
					) : (
						<Text c='dimmed' size='sm'>
							No documents uploaded
						</Text>
					)}
				</Stack>
			</Paper>

			<Paper withBorder radius='md' p='lg'>
				<Stack gap='lg'>
					<Group justify='space-between'>
						<Group gap='sm'>
							<ThemeIcon size='lg' variant='light'>
								<IconSchool size={20} />
							</ThemeIcon>
							<Title order={4}>Academic Qualifications</Title>
						</Group>
						<Button
							variant='subtle'
							size='xs'
							leftSection={<IconEdit size={14} />}
							onClick={() => handleEdit('qualifications')}
						>
							Edit
						</Button>
					</Group>

					{hasRecords ? (
						<Table highlightOnHover withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Certificate</Table.Th>
									<Table.Th>Institution</Table.Th>
									<Table.Th>Year</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{applicant.academicRecords.map((record) => (
									<Table.Tr key={record.id}>
										<Table.Td>
											<Text size='sm'>{record.certificateType?.name}</Text>
										</Table.Td>
										<Table.Td>
											<Text size='sm'>{record.institutionName}</Text>
										</Table.Td>
										<Table.Td>
											<Text size='sm'>{record.examYear}</Text>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					) : (
						<Text c='dimmed' size='sm'>
							No academic records found
						</Text>
					)}
				</Stack>
			</Paper>

			<Divider />

			<Group justify='space-between'>
				<Button
					variant='subtle'
					leftSection={<IconArrowLeft size={16} />}
					onClick={handleBack}
				>
					Back
				</Button>
				<Button
					color='green'
					leftSection={<IconSend size={16} />}
					onClick={handleSubmit}
					disabled={!application}
					loading={submitMutation.isPending}
				>
					Submit Application
				</Button>
			</Group>
		</Stack>
	);
}
