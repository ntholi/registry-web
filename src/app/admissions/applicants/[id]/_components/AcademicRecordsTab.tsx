'use client';

import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
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
import {
	IconBooks,
	IconCertificate,
	IconFile,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useMemo, useState } from 'react';
import type { AcademicRecordWithRelations } from '../academic-records/_lib/types';
import { deleteAcademicRecord } from '../academic-records/_server/actions';
import { DocumentPreviewModal } from '../documents/_components/DocumentPreviewModal';
import type { ApplicantDocument } from '../documents/_lib/types';

type Props = {
	records: AcademicRecordWithRelations[];
};

export default function AcademicRecordsTab({ records }: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedDoc, setSelectedDoc] = useState<ApplicantDocument | null>(
		null
	);

	function openDocument(doc: ApplicantDocument) {
		setSelectedDoc(doc);
		open();
	}

	const consolidatedGroups = useMemo(() => {
		const groups = new Map<
			string,
			{
				type: AcademicRecordWithRelations['certificateType'];
				records: AcademicRecordWithRelations[];
			}
		>();

		for (const record of records) {
			const typeId = record.certificateType.id;
			if (!groups.has(typeId)) {
				groups.set(typeId, { type: record.certificateType, records: [] });
			}
			groups.get(typeId)!.records.push(record);
		}

		const consolidated = [];
		const standardGradeOrder = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];

		for (const group of groups.values()) {
			if (group.records.length > 1 && group.type.lqfLevel === 4) {
				const bestGrades = new Map<
					string,
					{
						subject: AcademicRecordWithRelations['subjectGrades'][number]['subject'];
						originalGrade: string;
						standardGrade: string;
					}
				>();

				for (const record of group.records) {
					for (const sg of record.subjectGrades) {
						const existing = bestGrades.get(sg.subject.id);
						const currentRank = standardGradeOrder.indexOf(sg.standardGrade);

						if (
							!existing ||
							(currentRank !== -1 &&
								currentRank <
									standardGradeOrder.indexOf(existing.standardGrade))
						) {
							bestGrades.set(sg.subject.id, {
								subject: sg.subject,
								originalGrade: sg.originalGrade,
								standardGrade: sg.standardGrade,
							});
						}
					}
				}

				consolidated.push({
					type: group.type,
					grades: Array.from(bestGrades.values()).sort((a, b) =>
						a.subject.name.localeCompare(b.subject.name)
					),
				});
			}
		}
		return consolidated;
	}, [records]);

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
			{consolidatedGroups.length > 0 && (
				<Stack gap='sm'>
					<Text size='xs' fw={700} c='dimmed' px='md'>
						CONSOLIDATED VIEW
					</Text>
					{consolidatedGroups.map((group) => (
						<Box key={group.type.id} px='md'>
							<Accordion variant='separated'>
								<Accordion.Item value={`consolidated-${group.type.id}`}>
									<Accordion.Control>
										<Group gap='md'>
											<IconBooks size={20} />
											<Stack gap={2}>
												<Text fw={600}>{group.type.name} (Combined)</Text>
												<Text size='xs' c='dimmed'>
													Best performance across{' '}
													{
														records.filter(
															(r) => r.certificateType.id === group.type.id
														).length
													}{' '}
													sittings
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
												{group.grades.map((g) => (
													<Table.Tr key={g.subject.id}>
														<Table.Td>{g.subject.name}</Table.Td>
														<Table.Td ta='center'>
															<Badge
																variant='light'
																size='sm'
																color={getGradeColor(g.standardGrade)}
															>
																{g.standardGrade}
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
			{records.length > 0 ? (
				<Stack gap='sm'>
					{records.map((record) => {
						const hasGrades =
							record.certificateType.lqfLevel === 4 &&
							record.subjectGrades.length > 0;

						return (
							<Box key={record.id} px='md'>
								{hasGrades ? (
									<Accordion variant='separated'>
										<Accordion.Item value={record.id.toString()}>
											<Accordion.Control>
												<Group justify='space-between' w='100%'>
													<Group gap='md'>
														<IconCertificate size={20} opacity={0.6} />
														<Stack gap={2}>
															<Group gap='xs'>
																<Text fw={600}>
																	{record.certificateType.name}
																</Text>
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
															</Group>
															<Text size='sm' c='dimmed'>
																{record.institutionName} • {record.examYear}
															</Text>
														</Stack>
													</Group>
													<Group gap='xs'>
														{record.applicantDocument && (
															<Tooltip label='View Document'>
																<ActionIcon
																	component='div'
																	variant='default'
																	onClick={(event) => {
																		event.stopPropagation();
																		openDocument(record.applicantDocument!);
																	}}
																>
																	<IconFile size={16} />
																</ActionIcon>
															</Tooltip>
														)}
														<Tooltip label='Delete'>
															<ActionIcon
																component='div'
																color='red'
																variant='subtle'
																onClick={(event) => {
																	event.stopPropagation();
																	deleteMutation.mutate(record.id);
																}}
																loading={deleteMutation.isPending}
															>
																<IconTrash size={16} />
															</ActionIcon>
														</Tooltip>
													</Group>
												</Group>
											</Accordion.Control>
											<Accordion.Panel>
												{record.certificateType.lqfLevel > 4 && (
													<Group gap='xs' mb='sm'>
														{record.qualificationName && (
															<Text size='sm'>{record.qualificationName}</Text>
														)}
														{record.resultClassification && (
															<Badge
																variant='light'
																color={getClassificationColor(
																	record.resultClassification
																)}
															>
																{record.resultClassification}
															</Badge>
														)}
													</Group>
												)}
												<Table striped highlightOnHover withTableBorder>
													<Table.Thead>
														<Table.Tr>
															<Table.Th>Subject</Table.Th>
															<Table.Th w={80}>Original</Table.Th>
															<Table.Th w={80}>Grade</Table.Th>
														</Table.Tr>
													</Table.Thead>
													<Table.Tbody>
														{record.subjectGrades.map((sg) => (
															<Table.Tr key={sg.id}>
																<Table.Td>{sg.subject.name}</Table.Td>
																<Table.Td ta='center'>
																	{sg.originalGrade}
																</Table.Td>
																<Table.Td ta='center'>
																	<Badge
																		variant='light'
																		size='sm'
																		color={getGradeColor(sg.standardGrade)}
																	>
																		{sg.standardGrade}
																	</Badge>
																</Table.Td>
															</Table.Tr>
														))}
													</Table.Tbody>
												</Table>
											</Accordion.Panel>
										</Accordion.Item>
									</Accordion>
								) : (
									<Group justify='space-between'>
										<Group gap='md'>
											<IconCertificate size={20} opacity={0.6} />
											<Stack gap={2}>
												<Group gap='xs'>
													<Text fw={600}>{record.certificateType.name}</Text>
													<Badge variant='light' size='sm'>
														LQF {record.certificateType.lqfLevel}
													</Badge>
												</Group>
												<Text size='sm' c='dimmed'>
													{record.institutionName} • {record.examYear}
												</Text>
											</Stack>
										</Group>
										<Group gap='xs'>
											{record.applicantDocument && (
												<Tooltip label='View Document'>
													<ActionIcon
														variant='subtle'
														onClick={() =>
															openDocument(record.applicantDocument!)
														}
													>
														<IconFile size={16} />
													</ActionIcon>
												</Tooltip>
											)}
											<Tooltip label='Delete'>
												<ActionIcon
													color='red'
													variant='subtle'
													onClick={() => deleteMutation.mutate(record.id)}
													loading={deleteMutation.isPending}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Tooltip>
										</Group>
									</Group>
								)}

								{record.certificateType.lqfLevel > 4 && !hasGrades && (
									<Group gap='xs'>
										{record.qualificationName && (
											<Text size='sm'>{record.qualificationName}</Text>
										)}
										{record.resultClassification && (
											<Badge
												variant='light'
												color={getClassificationColor(
													record.resultClassification
												)}
											>
												{record.resultClassification}
											</Badge>
										)}
									</Group>
								)}
							</Box>
						);
					})}
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
