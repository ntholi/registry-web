'use client';

import { Badge, Paper, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { useState } from 'react';
import type {
	ObservationCategoryAverage,
	ObservationLecturerRanking,
} from '../_lib/types';

type SortField =
	| 'lecturerName'
	| 'schoolCode'
	| 'observationCount'
	| 'avgScore'
	| string;

type Props = {
	data: ObservationLecturerRanking[];
	categories: ObservationCategoryAverage[];
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

function abbreviate(name: string, max = 12): string {
	if (name.length <= max) return name;
	const ampIdx = name.indexOf('&');
	if (ampIdx > 0) return name.substring(0, ampIdx).trim();
	return `${name.substring(0, max - 1)}…`;
}

export default function LecturerTable({ data, categories }: Props) {
	const [sortField, setSortField] = useState<SortField>('avgScore');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortField(field);
			setSortDir('desc');
		}
	}

	function getValue(
		lecturer: ObservationLecturerRanking,
		field: SortField
	): number | string {
		switch (field) {
			case 'lecturerName':
				return lecturer.lecturerName;
			case 'schoolCode':
				return lecturer.schoolCode;
			case 'observationCount':
				return lecturer.observationCount;
			case 'avgScore':
				return lecturer.avgScore;
			default:
				return lecturer.categoryAverages[field] ?? 0;
		}
	}

	const sorted = [...data].sort((a, b) => {
		const aVal = getValue(a, sortField);
		const bVal = getValue(b, sortField);
		const cmp =
			typeof aVal === 'string'
				? aVal.localeCompare(bVal as string)
				: (aVal as number) - (bVal as number);
		return sortDir === 'asc' ? cmp : -cmp;
	});

	function sortIndicator(field: SortField) {
		if (sortField !== field) return '';
		return sortDir === 'asc' ? ' ↑' : ' ↓';
	}

	function th(label: string, field: SortField) {
		return (
			<Table.Th
				key={field}
				onClick={() => handleSort(field)}
				style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
			>
				{label}
				{sortIndicator(field)}
			</Table.Th>
		);
	}

	const colCount = 5 + categories.length;

	return (
		<Paper withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>Lecturer Rankings</Text>
				<ScrollArea>
					<Table fz='sm'>
						<Table.Thead>
							<Table.Tr>
								{th('#', 'avgScore')}
								{th('Lecturer', 'lecturerName')}
								{th('School', 'schoolCode')}
								{th('Obs', 'observationCount')}
								{th('Avg', 'avgScore')}
								{categories.map((c) =>
									th(abbreviate(c.categoryName), c.categoryName)
								)}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{sorted.map((lecturer, idx) => (
								<Table.Tr key={lecturer.userId}>
									<Table.Td>{idx + 1}</Table.Td>
									<Table.Td style={{ whiteSpace: 'nowrap' }}>
										{lecturer.lecturerName}
									</Table.Td>
									<Table.Td>{lecturer.schoolCode}</Table.Td>
									<Table.Td ta='center'>{lecturer.observationCount}</Table.Td>
									<Table.Td>
										<Badge
											color={ratingColor(lecturer.avgScore)}
											variant='light'
											size='sm'
										>
											{lecturer.avgScore.toFixed(2)}
										</Badge>
									</Table.Td>
									{categories.map((c) => {
										const val = lecturer.categoryAverages[c.categoryName] ?? 0;
										return (
											<Table.Td key={c.categoryId} ta='center'>
												<Text size='xs' c={ratingColor(val)}>
													{val > 0 ? val.toFixed(2) : '-'}
												</Text>
											</Table.Td>
										);
									})}
								</Table.Tr>
							))}
							{sorted.length === 0 && (
								<Table.Tr>
									<Table.Td colSpan={colCount} ta='center' c='dimmed'>
										No lecturers found
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				</ScrollArea>
			</Stack>
		</Paper>
	);
}
