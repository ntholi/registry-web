'use client';

import {
	Badge,
	Box,
	Collapse,
	Paper,
	Popover,
	ScrollArea,
	Stack,
	Table,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';
import type {
	CategoryAverage,
	FeedbackLecturerRanking,
	ReportFilter,
} from '../_lib/types';
import FeedbackLecturerDetail from './FeedbackLecturerDetail';

type SortField =
	| 'lecturerName'
	| 'schoolCode'
	| 'moduleCount'
	| 'responseCount'
	| 'avgRating'
	| string;

type Props = {
	data: FeedbackLecturerRanking[];
	categories: CategoryAverage[];
	filter: ReportFilter;
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

export default function FeedbackLecturerTable({
	data,
	categories,
	filter,
}: Props) {
	const [sortField, setSortField] = useState<SortField>('avgRating');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
	const [expandedId, setExpandedId] = useState<string | null>(null);

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortField(field);
			setSortDir('desc');
		}
	}

	function getValue(
		lecturer: FeedbackLecturerRanking,
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

	function th(label: string, field: SortField, tooltip?: string) {
		const header = (
			<Table.Th
				onClick={() => handleSort(field)}
				style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
			>
				{label}
				{sortIndicator(field)}
			</Table.Th>
		);
		if (tooltip && tooltip !== label) {
			return (
				<Popover key={field} position='top' withArrow>
					<Popover.Target>{header}</Popover.Target>
					<Popover.Dropdown p='xs'>
						<Text size='xs'>{tooltip}</Text>
					</Popover.Dropdown>
				</Popover>
			);
		}
		return header;
	}

	const colCount = 7 + categories.length;

	function toggleRow(userId: string) {
		setExpandedId((prev) => (prev === userId ? null : userId));
	}

	return (
		<Paper withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>Lecturer Rankings</Text>
				<ScrollArea>
					<Table fz='sm'>
						<Table.Thead>
							<Table.Tr>
								<Table.Th w={36} />
								{th('#', 'avgRating')}
								{th('Lecturer', 'lecturerName')}
								{th('School', 'schoolCode')}
								{th('Mod', 'moduleCount', 'Modules')}
								{th('Resp', 'responseCount', 'Responses')}
								{th('Avg', 'avgRating', 'Average Rating')}
								{categories.map((c) =>
									th(abbreviate(c.categoryName), c.categoryName, c.categoryName)
								)}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{sorted.map((lecturer, idx) => {
								const isExpanded = expandedId === lecturer.userId;
								return (
									<LecturerRow
										key={lecturer.userId}
										lecturer={lecturer}
										idx={idx}
										categories={categories}
										isExpanded={isExpanded}
										colCount={colCount}
										filter={filter}
										onToggle={() => toggleRow(lecturer.userId)}
									/>
								);
							})}
							{sorted.length === 0 && (
								<Table.Tr>
									<Table.Td colSpan={colCount + 1} ta='center' c='dimmed'>
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

type LecturerRowProps = {
	lecturer: FeedbackLecturerRanking;
	idx: number;
	categories: CategoryAverage[];
	isExpanded: boolean;
	colCount: number;
	filter: ReportFilter;
	onToggle: () => void;
};

function LecturerRow({
	lecturer,
	idx,
	categories,
	isExpanded,
	colCount,
	filter,
	onToggle,
}: LecturerRowProps) {
	return (
		<>
			<Table.Tr style={{ cursor: 'pointer' }} onClick={onToggle}>
				<Table.Td w={36}>
					<UnstyledButton>
						<IconChevronRight
							size={16}
							style={{
								transform: isExpanded ? 'rotate(90deg)' : undefined,
								transition: 'transform 200ms',
							}}
						/>
					</UnstyledButton>
				</Table.Td>
				<Table.Td>{idx + 1}</Table.Td>
				<Table.Td style={{ whiteSpace: 'nowrap' }}>
					{lecturer.lecturerName}
				</Table.Td>
				<Table.Td>{lecturer.schoolCode}</Table.Td>
				<Table.Td ta='center'>{lecturer.moduleCount}</Table.Td>
				<Table.Td ta='center'>{lecturer.responseCount}</Table.Td>
				<Table.Td>
					<Badge
						color={ratingColor(lecturer.avgRating)}
						variant='light'
						size='sm'
					>
						{lecturer.avgRating.toFixed(2)}
					</Badge>
				</Table.Td>
				{categories.map((c) => {
					const val = lecturer.categoryAverages[c.categoryName] ?? 0;
					return (
						<Table.Td key={c.categoryId} ta='center'>
							<Text size='xs' c={ratingColor(val)}>
								{val.toFixed(2)}
							</Text>
						</Table.Td>
					);
				})}
			</Table.Tr>
			<Table.Tr>
				<Table.Td
					colSpan={colCount + 1}
					p={0}
					style={{ borderTop: isExpanded ? undefined : 'none' }}
				>
					<Collapse in={isExpanded}>
						<Box p='md'>
							<FeedbackLecturerDetail
								userId={lecturer.userId}
								filter={filter}
							/>
						</Box>
					</Collapse>
				</Table.Td>
			</Table.Tr>
		</>
	);
}
