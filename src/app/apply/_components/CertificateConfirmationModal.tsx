'use client';

import {
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Modal,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconAward,
	IconCertificate,
	IconCheck,
	IconX,
} from '@tabler/icons-react';
import { getGradeColor } from '@/app/admissions/applicants/[id]/_components/AcademicRecordsTab';
import type { CertificateDocumentResult } from '@/core/integrations/ai/documents';

type Props = {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
	analysis: CertificateDocumentResult | null;
	loading?: boolean;
};

function CertField({
	label,
	value,
	highlight,
}: {
	label: string;
	value?: string | number | null;
	highlight?: boolean;
}) {
	return (
		<Stack gap={2} ta='center'>
			<Text size='xs' c='dimmed' tt='uppercase' fw={500}>
				{label}
			</Text>
			<Text
				size={highlight ? 'lg' : 'sm'}
				fw={highlight ? 700 : 500}
				c={highlight ? 'cyan' : undefined}
			>
				{value?.toString() || '—'}
			</Text>
		</Stack>
	);
}

export function CertificateConfirmationModal({
	opened,
	onClose,
	onConfirm,
	analysis,
	loading,
}: Props) {
	if (!analysis) return null;

	const hasSubjects = analysis.subjects && analysis.subjects.length > 0;
	const isResultsSlip =
		analysis.documentType === 'transcript' ||
		analysis.documentType === 'academic_record' ||
		hasSubjects;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Confirm Academic Document'
			centered
			size='lg'
		>
			<Stack gap='lg'>
				<Paper
					p={0}
					radius='md'
					style={{
						background:
							'linear-gradient(180deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)',
						border: '1px double var(--mantine-color-dark-4)',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					<Box bg={'dark.8'}>
						<Box p={'md'}>
							<Group justify='center' gap='sm'>
								<ThemeIcon variant='filled' size={36} radius='xl' color='dark'>
									<IconCertificate size={50} />
								</ThemeIcon>
								<Stack gap={0} ta='center'>
									<Text size='lg' fw={600} tt='uppercase' lts={2}>
										{analysis.certificateType || 'Academic Document'}
									</Text>
									{analysis.issuingAuthority && (
										<Text size='xs' c='dark.3' fw={500}>
											Issued by {analysis.issuingAuthority}
										</Text>
									)}
								</Stack>
							</Group>
						</Box>
						<Divider my='sm' />
					</Box>

					<Stack gap='md' p='lg'>
						<Stack gap={4} ta='center'>
							<Text size='xs' c='dimmed'>
								Name on Document
							</Text>
							<Text size='xl' fw={700} ff='Georgia, serif'>
								{analysis.studentName || '—'}
							</Text>
						</Stack>

						<Divider
							label={<IconAward size={16} />}
							labelPosition='center'
							color='dark.5'
						/>

						<Stack>
							<SimpleGrid cols={{ base: 2 }} spacing='md'>
								<CertField label='Exam Year' value={analysis.examYear} />
								{analysis.certificateNumber && (
									<CertField
										label='Cert No.'
										value={analysis.certificateNumber}
									/>
								)}
								{analysis.overallClassification && (
									<CertField
										label='Classification'
										value={analysis.overallClassification}
										highlight
									/>
								)}
							</SimpleGrid>
							<CertField label='Institution' value={analysis.institutionName} />
						</Stack>

						{hasSubjects && (
							<>
								<Divider color='dark.5' my='xs' />
								<Stack gap='xs'>
									<Group justify='space-between'>
										<Text size='sm' fw={600}>
											Subjects & Grades
										</Text>
										<Badge variant='light' size='sm'>
											{analysis.subjects?.length} subjects
										</Badge>
									</Group>
									<ScrollArea.Autosize mah={200}>
										<Table
											striped
											highlightOnHover
											withTableBorder
											withColumnBorders
										>
											<Table.Thead>
												<Table.Tr>
													<Table.Th>Subject</Table.Th>
													<Table.Th ta='center' w={80}>
														Grade
													</Table.Th>
												</Table.Tr>
											</Table.Thead>
											<Table.Tbody>
												{analysis.subjects?.map((subject, index) => (
													<Table.Tr key={index}>
														<Table.Td>
															<Text size='sm'>{subject.name}</Text>
														</Table.Td>
														<Table.Td ta='center'>
															<Badge
																variant='light'
																color={getGradeColor(subject.grade)}
																size='md'
															>
																{subject.grade}
															</Badge>
														</Table.Td>
													</Table.Tr>
												))}
											</Table.Tbody>
										</Table>
									</ScrollArea.Autosize>
								</Stack>
							</>
						)}

						{!isResultsSlip && !hasSubjects && (
							<Box ta='center' py='md'>
								<ThemeIcon
									variant='light'
									size={60}
									radius='xl'
									color='yellow'
									mx='auto'
									mb='sm'
								>
									<IconAward size={32} />
								</ThemeIcon>
								<Text size='sm' c='dimmed'>
									Certificate document verified
								</Text>
							</Box>
						)}
					</Stack>
				</Paper>

				<Group justify='space-between' gap='sm'>
					<Button
						variant='light'
						color='red'
						leftSection={<IconX size={16} />}
						onClick={onClose}
						disabled={loading}
					>
						Try Again
					</Button>
					<Button
						leftSection={<IconCheck size={16} />}
						onClick={onConfirm}
						loading={loading}
					>
						Confirm
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
