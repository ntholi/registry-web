'use client';

import {
	Badge,
	Paper,
	ScrollArea,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import type { OverviewLecturerRanking } from '../_lib/types';

type SortField =
	| 'lecturerName'
	| 'schoolCode'
	| 'feedbackAvg'
	| 'observationAvg'
	| 'combinedAvg';

type Props = {
	data: OverviewLecturerRanking[];
};

function ratingColor(avg: number) {
	if (avg >= 4) return 'green';
	if (avg >= 3) return 'yellow';
	return 'red';
}

export default function SimpleLecturerTable({ data }: Props) {
	const [sortField, setSortField] = useState<SortField>('combinedAvg');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
	const [search, setSearch] = useState('');
	const [showAll, setShowAll] = useState(false);

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortField(field);
			setSortDir('desc');
		}
	}

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

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		if (!q) return data;
		return data.filter(
			(l) =>
				l.lecturerName.toLowerCase().includes(q) ||
				l.schoolCode.toLowerCase().includes(q)
		);
	}, [data, search]);

	const sorted = useMemo(() => {
		return [...filtered].sort((a, b) => {
			const aVal = a[sortField];
			const bVal = b[sortField];
			const cmp =
				typeof aVal === 'string'
					? aVal.localeCompare(bVal as string)
					: (aVal as number) - (bVal as number);
			return sortDir === 'asc' ? cmp : -cmp;
		});
	}, [filtered, sortField, sortDir]);

	const displayed =
		showAll || sorted.length <= 20 ? sorted : sorted.slice(0, 20);

	return (
		<Paper withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>Combined Lecturer Rankings</Text>
				<TextInput
					placeholder='Search lecturers...'
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
				/>
				<ScrollArea>
					<Table fz='sm'>
						<Table.Thead>
							<Table.Tr>
								{th('#', 'combinedAvg')}
								{th('Lecturer', 'lecturerName')}
								{th('School', 'schoolCode')}
								{th('Feedback Avg', 'feedbackAvg')}
								{th('Observation Avg', 'observationAvg')}
								{th('Combined Avg', 'combinedAvg')}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{displayed.map((l, idx) => (
								<Table.Tr key={l.userId}>
									<Table.Td>{idx + 1}</Table.Td>
									<Table.Td style={{ whiteSpace: 'nowrap' }}>
										{l.lecturerName}
									</Table.Td>
									<Table.Td>{l.schoolCode}</Table.Td>
									<Table.Td>
										{l.feedbackAvg > 0 ? (
											<Badge
												color={ratingColor(l.feedbackAvg)}
												variant='light'
												size='sm'
											>
												{l.feedbackAvg.toFixed(2)}
											</Badge>
										) : (
											<Text size='xs' c='dimmed'>
												-
											</Text>
										)}
									</Table.Td>
									<Table.Td>
										{l.observationAvg > 0 ? (
											<Badge
												color={ratingColor(l.observationAvg)}
												variant='light'
												size='sm'
											>
												{l.observationAvg.toFixed(2)}
											</Badge>
										) : (
											<Text size='xs' c='dimmed'>
												-
											</Text>
										)}
									</Table.Td>
									<Table.Td>
										<Badge
											color={ratingColor(l.combinedAvg)}
											variant='light'
											size='sm'
										>
											{l.combinedAvg.toFixed(2)}
										</Badge>
									</Table.Td>
								</Table.Tr>
							))}
							{displayed.length === 0 && (
								<Table.Tr>
									<Table.Td colSpan={6} ta='center' c='dimmed'>
										No lecturers found
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				</ScrollArea>
				{!showAll && sorted.length > 20 && (
					<Text
						size='sm'
						c='blue'
						ta='center'
						style={{ cursor: 'pointer' }}
						onClick={() => setShowAll(true)}
					>
						Show All ({sorted.length} lecturers)
					</Text>
				)}
			</Stack>
		</Paper>
	);
}
