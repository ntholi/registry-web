'use client';

import { Badge, Paper, Stack, Table, Title } from '@mantine/core';
import { grades } from '@/shared/lib/utils/grades';
import { getGradeColor } from './gradeColors';

export function GradeTable() {
	const uniqueGrades = grades.filter(
		(grade, index, array) =>
			array.findIndex((g) => g.grade === grade.grade) === index
	);

	const rows = uniqueGrades.map((grade) => (
		<Table.Tr key={grade.grade}>
			<Table.Td>
				{grade.marksRange
					? `${grade.marksRange.min} - ${grade.marksRange.max}`
					: 'N/A'}
			</Table.Td>
			<Table.Td>
				{grade.points !== null ? grade.points.toFixed(2) : 'N/A'}
			</Table.Td>
			<Table.Td>
				<Badge
					color={getGradeColor(grade.grade)}
					variant='light'
					w={50}
					radius={'md'}
				>
					{grade.grade}
				</Badge>
			</Table.Td>
			<Table.Td>{grade.description}</Table.Td>
		</Table.Tr>
	));

	return (
		<Paper withBorder shadow='sm' p='lg'>
			<Stack gap='md'>
				<Title order={3} size={'h4'}>
					Tabulation of Grades
				</Title>
				<Table highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Marks Range</Table.Th>
							<Table.Th>Points</Table.Th>
							<Table.Th>Grade</Table.Th>
							<Table.Th>Description</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			</Stack>
		</Paper>
	);
}
