'use client';

import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Card,
	Divider,
	Group,
	Paper,
	Stack,
	Table,
	Text,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconBooks, IconCertificate, IconFile } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { type MouseEvent, useMemo, useState } from 'react';
import { DeleteButton } from '@/shared/ui/adease/DeleteButton';
import type { AcademicRecordWithRelations } from '../academic-records/_lib/types';
import { deleteAcademicRecord } from '../academic-records/_server/actions';
import { DocumentPreviewModal } from '../documents/_components/DocumentPreviewModal';
import type { ApplicantDocument } from '../documents/_lib/types';

type Props = {
	records: AcademicRecordWithRelations[];
};

type SectionProps = {
	records: AcademicRecordWithRelations[];
	onOpenDocument: (doc: ApplicantDocument) => void;
	onDelete: (id: string) => Promise<void>;
	isDeleting: boolean;
};

type CardProps = {
	record: AcademicRecordWithRelations;
	prioritizeQualification: boolean;
	defaultOpen?: boolean;
	onOpenDocument: (doc: ApplicantDocument) => void;
	onDelete: (id: string) => Promise<void>;
	isDeleting: boolean;
};

export default function AcademicRecordsTab({ records }: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedDoc, setSelectedDoc] = useState<ApplicantDocument | null>(
		null
	);
	const lowerLqfRecords = useMemo(
		() => records.filter((record) => record.certificateType.lqfLevel <= 4),
		[records]
	);
	const higherLqfRecords = useMemo(
		() => records.filter((record) => record.certificateType.lqfLevel >= 5),
		[records]
	);

	function openDocument(doc: ApplicantDocument) {
		setSelectedDoc(doc);
		open();
	}

	const deleteMutation = useMutation({
		mutationFn: deleteAcademicRecord,
		onSuccess: () => {
			router.refresh();
			notifications.show({
				title: 'Success',
				message: 'Academic record deleted',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	return (
		<Stack gap='md'>
			{records.length > 0 ? (
				<Stack gap='sm'>
					{lowerLqfRecords.length > 0 && (
						<LowerLqfRecordsSection
							records={lowerLqfRecords}
							onOpenDocument={openDocument}
							onDelete={async (id) => {
								await deleteMutation.mutateAsync(id);
							}}
							isDeleting={deleteMutation.isPending}
						/>
					)}
					{higherLqfRecords.length > 0 && (
						<HigherLqfRecordsSection
							records={higherLqfRecords}
							onOpenDocument={openDocument}
							onDelete={async (id) => {
								await deleteMutation.mutateAsync(id);
							}}
							isDeleting={deleteMutation.isPending}
						/>
					)}
				</Stack>
			) : (
				<Paper p='xl' radius='md' withBorder>
					<Stack align='center' gap='xs'>
						<IconCertificate size={32} opacity={0.3} />
						<Text size='sm' c='dimmed'>
							No academic records added
						</Text>
					</Stack>
				</Paper>
			)}
			<DocumentPreviewModal
				opened={opened}
				onClose={close}
				applicantDoc={selectedDoc}
			/>
		</Stack>
	);
}

function LowerLqfRecordsSection({
	records,
	onOpenDocument,
	onDelete,
	isDeleting,
}: SectionProps) {
	const firstRecordWithGradesId = useMemo(
		() => records.find((record) => record.subjectGrades.length > 0)?.id,
		[records]
	);

	const consolidatedGroups = useMemo(() => {
		const level4Records = records.filter(
			(record) => record.certificateType.lqfLevel === 4
		);
		if (level4Records.length <= 1) return [];

		const standardGradeOrder = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];
		const bestGrades = new Map<
			string,
			{
				subject: AcademicRecordWithRelations['subjectGrades'][number]['subject'];
				standardGrade: string | null;
			}
		>();

		for (const record of level4Records) {
			for (const sg of record.subjectGrades) {
				if (!sg.standardGrade) continue;
				const existing = bestGrades.get(sg.subject.id);
				const currentRank = standardGradeOrder.indexOf(sg.standardGrade);

				if (
					!existing ||
					!existing.standardGrade ||
					(currentRank !== -1 &&
						currentRank < standardGradeOrder.indexOf(existing.standardGrade))
				) {
					bestGrades.set(sg.subject.id, {
						subject: sg.subject,
						standardGrade: sg.standardGrade,
					});
				}
			}
		}

		if (bestGrades.size === 0) return [];

		const certTypeNames = [
			...new Set(level4Records.map((record) => record.certificateType.name)),
		];

		return [
			{
				label: `LQF Level 4 (Combined)`,
				certTypeNames,
				recordCount: level4Records.length,
				grades: Array.from(bestGrades.values()).sort((a, b) =>
					a.subject.name.localeCompare(b.subject.name)
				),
			},
		];
	}, [records]);

	return (
		<Stack gap='sm'>
			{consolidatedGroups.length > 0 && (
				<Stack gap='sm'>
					{consolidatedGroups.map((group) => (
						<Box key='consolidated-lqf4' px='md'>
							<Accordion variant='separated' defaultValue='consolidated-lqf4'>
								<Accordion.Item value='consolidated-lqf4'>
									<Accordion.Control>
										<Group gap='md'>
											<IconBooks size={20} />
											<Stack gap={2}>
												<Text fw={600}>{group.label}</Text>
												<Text size='xs' c='dimmed'>
													Best performance across {group.recordCount} records (
													{group.certTypeNames.join(' / ')})
												</Text>
											</Stack>
										</Group>
									</Accordion.Control>
									<Accordion.Panel>
										<Table striped highlightOnHover withTableBorder>
											<Table.Thead>
												<Table.Tr>
													<Table.Th>Subject</Table.Th>
													<Table.Th w={100} ta='center'>
														Grade
													</Table.Th>
												</Table.Tr>
											</Table.Thead>
											<Table.Tbody>
												{group.grades.map((grade) => (
													<Table.Tr key={grade.subject.id}>
														<Table.Td>{grade.subject.name}</Table.Td>
														<Table.Td ta='center'>
															<Badge
																variant='light'
																size='sm'
																color={getGradeColor(grade.standardGrade)}
															>
																{grade.standardGrade}
															</Badge>
														</Table.Td>
													</Table.Tr>
												))}
											</Table.Tbody>
										</Table>
									</Accordion.Panel>
								</Accordion.Item>
							</Accordion>
						</Box>
					))}
					<Divider
						label='Individual Records'
						labelPosition='center'
						my='xs'
						variant='dashed'
					/>
				</Stack>
			)}
			{records.map((record) => (
				<AcademicRecordCard
					key={record.id}
					record={record}
					prioritizeQualification={false}
					defaultOpen={
						consolidatedGroups.length === 0 &&
						record.id === firstRecordWithGradesId
					}
					onOpenDocument={onOpenDocument}
					onDelete={onDelete}
					isDeleting={isDeleting}
				/>
			))}
		</Stack>
	);
}

function HigherLqfRecordsSection({
	records,
	onOpenDocument,
	onDelete,
	isDeleting,
}: SectionProps) {
	return (
		<Stack gap='sm'>
			{records.map((record) => (
				<AcademicRecordCard
					key={record.id}
					record={record}
					prioritizeQualification
					onOpenDocument={onOpenDocument}
					onDelete={onDelete}
					isDeleting={isDeleting}
				/>
			))}
		</Stack>
	);
}

function AcademicRecordCard({
	record,
	prioritizeQualification,
	defaultOpen = false,
	onOpenDocument,
	onDelete,
	isDeleting,
}: CardProps) {
	const hasGrades = record.subjectGrades.length > 0;
	const isLevel4 = record.certificateType.lqfLevel === 4;

	return (
		<Box px='md'>
			{hasGrades ? (
				<Accordion
					variant='separated'
					defaultValue={defaultOpen ? record.id.toString() : undefined}
				>
					<Accordion.Item value={record.id.toString()}>
						<Accordion.Control>
							<Group justify='space-between' w='100%'>
								<RecordHeaderContent
									record={record}
									prioritizeQualification={prioritizeQualification}
								/>
								<RecordActions
									record={record}
									onOpenDocument={onOpenDocument}
									onDelete={onDelete}
									isDeleting={isDeleting}
									isInsideAccordion
								/>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Table striped highlightOnHover withTableBorder>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Subject</Table.Th>
										<Table.Th w={80}>Grade</Table.Th>
										{isLevel4 && <Table.Th w={80}>Standard</Table.Th>}
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{record.subjectGrades.map((subjectGrade) => (
										<Table.Tr key={subjectGrade.id}>
											<Table.Td>{subjectGrade.subject.name}</Table.Td>
											<Table.Td ta='center'>
												{subjectGrade.originalGrade}
											</Table.Td>
											{isLevel4 && (
												<Table.Td ta='center'>
													<Badge
														variant='light'
														size='sm'
														color={getGradeColor(subjectGrade.standardGrade)}
													>
														{subjectGrade.standardGrade}
													</Badge>
												</Table.Td>
											)}
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			) : (
				<Card withBorder>
					<Group justify='space-between' align='flex-start'>
						<RecordHeaderContent
							record={record}
							prioritizeQualification={prioritizeQualification}
						/>
						<RecordActions
							record={record}
							onOpenDocument={onOpenDocument}
							onDelete={onDelete}
							isDeleting={isDeleting}
						/>
					</Group>
				</Card>
			)}
		</Box>
	);
}

type HeaderProps = {
	record: AcademicRecordWithRelations;
	prioritizeQualification: boolean;
};

function RecordHeaderContent({ record, prioritizeQualification }: HeaderProps) {
	if (prioritizeQualification) {
		return (
			<Group gap='md' align='flex-start'>
				<IconCertificate size={20} opacity={0.6} />
				<Stack gap={2}>
					<QualificationSummary record={record} />
					<Text size='sm' c='dimmed'>
						{record.institutionName} • {record.examYear}
					</Text>
					<Group gap='xs'>
						<Text size='sm' ff={'monospace'} fw={600}>
							{record.certificateType.name}
						</Text>
						<RecordNumberBadges record={record} />
					</Group>
				</Stack>
			</Group>
		);
	}

	return (
		<Group gap='md'>
			<IconCertificate size={20} opacity={0.6} />
			<Stack gap={2}>
				<Group gap='xs'>
					<Text fw={600}>{record.certificateType.name}</Text>
					<RecordNumberBadges record={record} />
					{record.subjectGrades.length === 0 && (
						<Badge variant='light' size='sm'>
							LQF {record.certificateType.lqfLevel}
						</Badge>
					)}
				</Group>
				<Text size='sm' c='dimmed'>
					{record.institutionName} • {record.examYear}
				</Text>
			</Stack>
		</Group>
	);
}

function QualificationSummary({
	record,
}: {
	record: AcademicRecordWithRelations;
}) {
	if (!record.qualificationName && !record.resultClassification) {
		return null;
	}

	return (
		<Group gap='xs'>
			{record.qualificationName && (
				<Text size='sm'>{record.qualificationName}</Text>
			)}
			{record.resultClassification && (
				<Badge
					variant='light'
					color={getClassificationColor(record.resultClassification)}
				>
					{record.resultClassification}
				</Badge>
			)}
		</Group>
	);
}

function RecordNumberBadges({
	record,
}: {
	record: AcademicRecordWithRelations;
}) {
	return (
		<>
			{record.certificateNumber && (
				<Badge variant='default' size='sm'>
					{record.certificateNumber}
				</Badge>
			)}
			{record.candidateNumber && (
				<Badge variant='outline' size='sm'>
					{record.candidateNumber}
				</Badge>
			)}
		</>
	);
}

type ActionProps = {
	record: AcademicRecordWithRelations;
	onOpenDocument: (doc: ApplicantDocument) => void;
	onDelete: (id: string) => Promise<void>;
	isDeleting: boolean;
	isInsideAccordion?: boolean;
};

function RecordActions({
	record,
	onOpenDocument,
	onDelete,
	isDeleting,
	isInsideAccordion = false,
}: ActionProps) {
	return (
		<Group gap='xs'>
			{record.applicantDocument && (
				<Tooltip label='View Document'>
					<ActionIcon
						component={isInsideAccordion ? 'div' : 'button'}
						variant={isInsideAccordion ? 'default' : 'subtle'}
						onClick={(
							event: MouseEvent<HTMLButtonElement | HTMLDivElement>
						) => {
							if (isInsideAccordion) event.stopPropagation();
							onOpenDocument(record.applicantDocument!);
						}}
					>
						<IconFile size={16} />
					</ActionIcon>
				</Tooltip>
			)}
			<Tooltip label='Delete'>
				<DeleteButton
					handleDelete={() => onDelete(record.id)}
					onClick={(event) => {
						if (isInsideAccordion) event.stopPropagation();
					}}
					onSuccess={() => {}}
					itemType='academic record'
					itemName={`${record.certificateType.name} (${record.examYear})`}
					warningMessage={
						record.applicantDocument
							? 'This will permanently delete this academic record and its related document. This action cannot be undone.'
							: 'This will permanently delete this academic record. This action cannot be undone.'
					}
					confirmButtonText='Delete Record'
					variant='subtle'
					color='red'
					loading={isDeleting}
				/>
			</Tooltip>
		</Group>
	);
}

export function getGradeColor(grade: string | null) {
	if (!grade) return 'gray';
	const g = grade.toUpperCase();
	if (['A*', 'A', 'B', 'C'].includes(g)) return 'green';
	if (['D'].includes(g)) return 'yellow';
	if (['E', 'F', 'G', 'U'].includes(g)) return 'red';
	return 'gray';
}

function getClassificationColor(classification: string | null) {
	if (!classification) return 'gray';
	const c = classification.toLowerCase();
	if (['distinction', 'merit', 'credit', 'pass'].some((s) => c.includes(s)))
		return 'green';
	if (c.includes('fail')) return 'red';
	return 'gray';
}
