'use client';

import {
	ActionIcon,
	Badge,
	Collapse,
	Group,
	Paper,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconCertificate,
	IconChevronDown,
	IconChevronRight,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { AcademicRecordWithRelations } from '../academic-records/_lib/types';
import { deleteAcademicRecord } from '../academic-records/_server/actions';

type Props = {
	records: AcademicRecordWithRelations[];
};

export default function AcademicRecordsTab({ records }: Props) {
	const router = useRouter();
	const [expandedRecords, setExpandedRecords] = useState<Set<number>>(
		new Set()
	);

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

	function toggleExpand(id: number) {
		const newExpanded = new Set(expandedRecords);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedRecords(newExpanded);
	}

	return (
		<Stack gap='md'>
			{records.length > 0 ? (
				<Stack gap='sm'>
					{records.map((record) => {
						const isExpanded = expandedRecords.has(record.id);
						const hasGrades =
							record.certificateType.lqfLevel === 4 &&
							record.subjectGrades.length > 0;

						return (
							<Paper key={record.id} p='md' radius='md' withBorder>
								<Stack gap='md'>
									<Group justify='space-between'>
										<Group gap='md'>
											{hasGrades && (
												<ActionIcon
													variant='subtle'
													onClick={() => toggleExpand(record.id)}
												>
													{isExpanded ? (
														<IconChevronDown size={18} />
													) : (
														<IconChevronRight size={18} />
													)}
												</ActionIcon>
											)}
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

									{record.certificateType.lqfLevel > 4 && (
										<Group gap='xs'>
											{record.qualificationName && (
												<Text size='sm'>{record.qualificationName}</Text>
											)}
											{record.resultClassification && (
												<Badge variant='light'>
													{record.resultClassification}
												</Badge>
											)}
										</Group>
									)}

									{hasGrades && (
										<Collapse in={isExpanded}>
											<Table striped highlightOnHover withTableBorder mt='sm'>
												<Table.Thead>
													<Table.Tr>
														<Table.Th>Subject</Table.Th>
														<Table.Th>Original Grade</Table.Th>
														<Table.Th>Standard Grade</Table.Th>
													</Table.Tr>
												</Table.Thead>
												<Table.Tbody>
													{record.subjectGrades.map((sg) => (
														<Table.Tr key={sg.id}>
															<Table.Td>{sg.subject.name}</Table.Td>
															<Table.Td>{sg.originalGrade}</Table.Td>
															<Table.Td>
																<Badge variant='outline' size='sm'>
																	{sg.standardGrade}
																</Badge>
															</Table.Td>
														</Table.Tr>
													))}
												</Table.Tbody>
											</Table>
										</Collapse>
									)}
								</Stack>
							</Paper>
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
