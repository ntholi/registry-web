'use client';

import {
	ActionIcon,
	Badge,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { useState } from 'react';
import type {
	CategoryAverage,
	FeedbackReportFilter,
	LecturerRanking,
} from '../_lib/types';
import LecturerDetailModal from './LecturerDetailModal';

type SortField =
	| 'lecturerName'
	| 'schoolCode'
	| 'moduleCount'
	| 'responseCount'
	| 'avgRating'
	| string;

type Props = {
	data: LecturerRanking[];
	categories: CategoryAverage[];
	filter: FeedbackReportFilter;
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

export default function LecturerTable({ data, categories, filter }: Props) {
	const [sortField, setSortField] = useState<SortField>('avgRating');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortField(field);
			setSortDir('desc');
		}
	}

	function getValue(
		lecturer: LecturerRanking,
		field: SortField
	): number | string {
		switch (field) {
			case 'lecturerName':
				return lecturer.lecturerName;
			case 'schoolCode':
				return lecturer.schoolCode;
			case 'moduleCount':
				return lecturer.moduleCount;
			case 'responseCount':
				return lecturer.responseCount;
			case 'avgRating':
				return lecturer.avgRating;
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
				onClick={() => handleSort(field)}
				style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
			>
				{label}
				{sortIndicator(field)}
			</Table.Th>
		);
	}

	return (
		<>
			<Paper withBorder p='lg'>
				<Stack gap='md'>
					<Text fw={600}>Lecturer Rankings</Text>
					<ScrollArea>
						<Table striped highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>#</Table.Th>
									{th('Lecturer', 'lecturerName')}
									{th('School', 'schoolCode')}
									{th('Modules', 'moduleCount')}
									{th('Responses', 'responseCount')}
									{th('Avg Rating', 'avgRating')}
									{categories.map((c) => th(c.categoryName, c.categoryName))}
									<Table.Th>Action</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{sorted.map((lecturer, idx) => (
									<Table.Tr key={lecturer.userId}>
										<Table.Td>{idx + 1}</Table.Td>
										<Table.Td>{lecturer.lecturerName}</Table.Td>
										<Table.Td>{lecturer.schoolCode}</Table.Td>
										<Table.Td>{lecturer.moduleCount}</Table.Td>
										<Table.Td>{lecturer.responseCount}</Table.Td>
										<Table.Td>
											<Badge
												color={ratingColor(lecturer.avgRating)}
												variant='light'
											>
												{lecturer.avgRating.toFixed(2)}
											</Badge>
										</Table.Td>
										{categories.map((c) => (
											<Table.Td key={c.categoryId}>
												<Text
													size='sm'
													c={ratingColor(
														lecturer.categoryAverages[c.categoryName] ?? 0
													)}
												>
													{(
														lecturer.categoryAverages[c.categoryName] ?? 0
													).toFixed(2)}
												</Text>
											</Table.Td>
										))}
										<Table.Td>
											<Group gap={4}>
												<ActionIcon
													variant='subtle'
													size='sm'
													onClick={() => setSelectedUserId(lecturer.userId)}
												>
													<IconEye size={14} />
												</ActionIcon>
											</Group>
										</Table.Td>
									</Table.Tr>
								))}
								{sorted.length === 0 && (
									<Table.Tr>
										<Table.Td
											colSpan={7 + categories.length}
											ta='center'
											c='dimmed'
										>
											No lecturers found
										</Table.Td>
									</Table.Tr>
								)}
							</Table.Tbody>
						</Table>
					</ScrollArea>
				</Stack>
			</Paper>
			<LecturerDetailModal
				userId={selectedUserId}
				filter={filter}
				onClose={() => setSelectedUserId(null)}
			/>
		</>
	);
}
