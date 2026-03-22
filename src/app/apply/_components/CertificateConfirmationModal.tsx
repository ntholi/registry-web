'use client';

import {
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconAward, IconCertificate } from '@tabler/icons-react';
import type { CertificateDocumentResult } from '@/core/integrations/ai/documents';
import { getGradeColor } from '@/shared/lib/utils/colors';
import { BaseConfirmationModal } from './BaseConfirmationModal';
import { ConfirmationField } from './ConfirmationField';

type Props = {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
	analysis: CertificateDocumentResult | null;
	loading?: boolean;
};

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
		analysis.documentType === 'academic_record' || hasSubjects;

	return (
		<BaseConfirmationModal
			opened={opened}
			onClose={onClose}
			onConfirm={onConfirm}
			title='Confirm Academic Document'
			loading={loading}
			size='lg'
		>
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
							<Stack gap={0}>
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
							<ConfirmationField
								label='Exam Year'
								value={analysis.examYear}
								layout='vertical'
							/>
							{analysis.certificateNumber && (
								<ConfirmationField
									label='Cert No.'
									value={analysis.certificateNumber}
									layout='vertical'
								/>
							)}
							{analysis.overallClassification && (
								<ConfirmationField
									label='Classification'
									value={analysis.overallClassification}
									layout='vertical'
									highlight
								/>
							)}
						</SimpleGrid>
						<ConfirmationField
							label='Institution'
							value={analysis.institutionName}
							layout='vertical'
						/>
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
										<TableThead>
											<TableTr>
												<TableTh>Subject</TableTh>
												<TableTh ta='center' w={80}>
													Grade
												</TableTh>
											</TableTr>
										</TableThead>
										<TableTbody>
											{analysis.subjects?.map((subject, index) => (
												<TableTr key={index}>
													<TableTd>
														<Text size='sm'>{subject.name}</Text>
													</TableTd>
													<TableTd ta='center'>
														<Badge
															variant='light'
															color={getGradeColor(subject.grade)}
															size='md'
														>
															{subject.grade}
														</Badge>
													</TableTd>
												</TableTr>
											))}
										</TableTbody>
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
		</BaseConfirmationModal>
	);
}
