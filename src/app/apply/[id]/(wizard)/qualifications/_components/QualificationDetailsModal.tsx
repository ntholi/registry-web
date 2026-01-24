'use client';

import {
	Badge,
	Divider,
	Group,
	Modal,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCertificate } from '@tabler/icons-react';
import type { AcademicRecord } from './AcademicRecordCard';

type Props = {
	record: AcademicRecord;
	opened: boolean;
	onClose: () => void;
};

export function QualificationDetailsModal({ record, opened, onClose }: Props) {
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

				<Group justify='space-between' wrap='nowrap'>
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
							<Text size='xs' c='dimmed' ta='right'>
								Year
							</Text>
							<Text size='sm' fw={500}>
								{record.examYear}
							</Text>
						</Stack>
					)}
				</Group>
				<Group justify='space-between' wrap='nowrap'>
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
							<Text size='xs' c='dimmed' ta='right'>
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
			</Stack>
		</Modal>
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
