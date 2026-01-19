'use client';

import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Group,
	Paper,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCertificate, IconTrash } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import type { AcademicRecordWithRelations } from '../academic-records/_lib/types';
import { deleteAcademicRecord } from '../academic-records/_server/actions';

type Props = {
	records: AcademicRecordWithRelations[];
};

export default function AcademicRecordsTab({ records }: Props) {
	const router = useRouter();

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
																<Badge variant='default' size='sm'>
																	{record.certificateNumber}
																</Badge>
															</Group>
															<Text size='sm' c='dimmed'>
																{record.institutionName} • {record.examYear}
															</Text>
														</Stack>
													</Group>
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
										<ActionIcon
											color='red'
											variant='subtle'
											onClick={() => deleteMutation.mutate(record.id)}
											loading={deleteMutation.isPending}
										>
											<IconTrash size={16} />
										</ActionIcon>
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
		</Stack>
	);
}

function getGradeColor(grade: string | null) {
	if (!grade) return 'gray';
	const g = grade.toUpperCase();
	if (['A*', 'A', 'B', 'C'].includes(g)) return 'green';
	if (['D'].includes(g)) return 'yellow';
	if (['E', 'F', 'U'].includes(g)) return 'red';
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
