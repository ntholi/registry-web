'use client';

import { Badge, Collapse, Stack, Table, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCertificate } from '@tabler/icons-react';
import {
	DocumentCardShell,
	DocumentDetailRow,
} from '@/shared/ui/DocumentCardShell';

export type SubjectGrade = {
	id: string;
	originalGrade: string;
	standardGrade: string;
	subject: { id: string; name: string };
};

export type AcademicRecord = {
	id: string;
	certificateType?: { name: string; lqfLevel?: number | null } | null;
	institutionName?: string | null;
	examYear?: number | null;
	resultClassification?: string | null;
	qualificationName?: string | null;
	certificateNumber?: string | null;
	subjectGrades?: SubjectGrade[];
};

type Props = {
	record: AcademicRecord;
	onDelete: () => Promise<void>;
	deleting?: boolean;
};

export function AcademicRecordCard({ record, onDelete, deleting }: Props) {
	const [opened, { toggle }] = useDisclosure(false);
	const hasSubjects = record.subjectGrades && record.subjectGrades.length > 0;

	return (
		<DocumentCardShell
			icon={<IconCertificate size={20} />}
			title={record.certificateType?.name ?? 'Certificate'}
			onDelete={onDelete}
			deleting={deleting}
			deleteMessage='Are you sure you want to delete this academic record? This action cannot be undone.'
			onClick={hasSubjects ? toggle : undefined}
		>
			<Stack gap={4}>
				<DocumentDetailRow label='Institution' value={record.institutionName} />
				<DocumentDetailRow label='Year' value={record.examYear} />
				{hasSubjects && !opened && (
					<Text size='xs' c='dimmed' fs='italic' mt={4}>
						{record.subjectGrades?.length}{' '}
						{record.subjectGrades?.length === 1 ? 'subject' : 'subjects'} - tap
						to view
					</Text>
				)}
				<Collapse in={opened}>
					<Stack gap='xs' mt='sm'>
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
				</Collapse>
			</Stack>
		</DocumentCardShell>
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
