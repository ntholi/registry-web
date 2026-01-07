'use client';
import {
	Badge,
	Box,
	Group,
	Loader,
	Pagination,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import Link from '@/shared/ui/Link';
import {
	type GraduationReportFilter,
	getDefaultVisibleColumns,
} from './Filter';

interface Student {
	stdNo: number;
	name: string;
	programName: string;
	schoolName: string;
	schoolCode: string;
	sponsorName: string | null;
	graduationDate: string;
	gender: string | null;
	programLevel?: string | null;
	country?: string | null;
	age?: number | null;
}

interface StudentTableProps {
	data: Student[];
	isLoading: boolean;
	totalCount?: number;
	currentPage?: number;
	totalPages?: number;
	onPageChange?: (page: number) => void;
	searchQuery?: string;
	onSearchChange?: (query: string) => void;
	filter?: GraduationReportFilter;
}

interface TableColumn {
	key: string;
	label: string;
	minWidth: number;
	align?: 'left' | 'center' | 'right';
	render: (student: Student) => JSX.Element | string | number;
}

const ALL_COLUMNS: TableColumn[] = [
	{
		key: 'stdNo',
		label: 'Student No.',
		minWidth: 90,
		render: (student) => (
			<Link href={`/registry/students/${student.stdNo}`} size='sm' fw={500}>
				{student.stdNo}
			</Link>
		),
	},
	{
		key: 'name',
		label: 'Name',
		minWidth: 200,
		render: (student) => <Text size='sm'>{student.name}</Text>,
	},
	{
		key: 'gender',
		label: 'Gender',
		minWidth: 70,
		align: 'center',
		render: (student) => (
			<Text size='sm'>
				{student.gender === 'Male'
					? 'M'
					: student.gender === 'Female'
						? 'F'
						: '-'}
			</Text>
		),
	},
	{
		key: 'program',
		label: 'Program',
		minWidth: 250,
		render: (student) => (
			<Text size='sm' c='dimmed'>
				{student.programName}
			</Text>
		),
	},
	{
		key: 'school',
		label: 'School',
		minWidth: 100,
		render: (student) => (
			<Text size='sm' fw={500}>
				{student.schoolCode}
			</Text>
		),
	},
	{
		key: 'sponsor',
		label: 'Sponsor',
		minWidth: 150,
		render: (student) => (
			<Text size='sm' c='dimmed'>
				{student.sponsorName || '-'}
			</Text>
		),
	},
	{
		key: 'graduationDate',
		label: 'Graduation Date',
		minWidth: 120,
		align: 'center',
		render: (student) => (
			<Badge variant='light' size='sm'>
				{student.graduationDate}
			</Badge>
		),
	},
	{
		key: 'programLevel',
		label: 'Level',
		minWidth: 100,
		align: 'center',
		render: (student) => (
			<Badge variant='outline' size='sm'>
				{student.programLevel || '-'}
			</Badge>
		),
	},
	{
		key: 'country',
		label: 'Country',
		minWidth: 100,
		render: (student) => (
			<Text size='sm' c='dimmed'>
				{student.country || '-'}
			</Text>
		),
	},
	{
		key: 'age',
		label: 'Age',
		minWidth: 60,
		align: 'center',
		render: (student) => (
			<Text size='sm'>
				{student.age !== null && student.age !== undefined ? student.age : '-'}
			</Text>
		),
	},
];

function getVisibleColumns(filter?: GraduationReportFilter): TableColumn[] {
	const visibleKeys = filter?.visibleColumns ?? getDefaultVisibleColumns();
	return ALL_COLUMNS.filter((col) => visibleKeys.includes(col.key));
}

export default function StudentTable({
	data,
	isLoading,
	totalCount = 0,
	currentPage = 1,
	totalPages = 0,
	onPageChange,
	searchQuery = '',
	onSearchChange,
	filter,
}: StudentTableProps) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const showInitialLoader = isLoading && !data;
	const visibleColumns = getVisibleColumns(filter);

	if (showInitialLoader) {
		const rowCount = isMobile ? 5 : 10;
		return (
			<Paper withBorder p='md'>
				<Stack gap='md'>
					<TextInput
						placeholder='Search students...'
						leftSection={<IconSearch size={16} />}
						size='sm'
						disabled
					/>

					<ScrollArea>
						<Table horizontalSpacing='md' verticalSpacing='sm'>
							<Table.Thead>
								<Table.Tr>
									{visibleColumns.map((col) => (
										<Table.Th key={col.key} ta={col.align}>
											{col.label}
										</Table.Th>
									))}
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{Array.from(
									{ length: rowCount },
									(_, i) => `skeleton-row-${i}`
								).map((key) => (
									<Table.Tr key={key}>
										{visibleColumns.map((col) => (
											<Table.Td key={col.key} ta={col.align}>
												<Skeleton
													height={14}
													width={
														col.key === 'stdNo'
															? 70
															: col.key === 'gender'
																? 20
																: '60%'
													}
												/>
											</Table.Td>
										))}
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</ScrollArea>
				</Stack>
			</Paper>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Paper withBorder p='md'>
				<Stack gap='md'>
					<TextInput
						placeholder='Search students...'
						leftSection={<IconSearch size={16} />}
						rightSection={isLoading && <Loader size='xs' />}
						value={searchQuery}
						onChange={(event) => onSearchChange?.(event.currentTarget.value)}
						size='sm'
					/>

					<Box py='xl' ta='center'>
						<Text c='dimmed'>
							{searchQuery
								? 'No students match your search'
								: 'No students found'}
						</Text>
					</Box>
				</Stack>
			</Paper>
		);
	}

	return (
		<Paper withBorder p='md'>
			<Stack gap='md'>
				<TextInput
					placeholder='Search by student number, name, program, or school...'
					leftSection={<IconSearch size={16} />}
					rightSection={isLoading && <Loader size='xs' />}
					value={searchQuery}
					onChange={(event) => onSearchChange?.(event.currentTarget.value)}
					size='sm'
				/>

				<ScrollArea>
					<Table>
						<Table.Thead>
							<Table.Tr>
								{visibleColumns.map((col) => (
									<Table.Th
										key={col.key}
										ta={col.align}
										miw={isMobile ? Math.min(col.minWidth, 140) : col.minWidth}
									>
										{col.label}
									</Table.Th>
								))}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{data.map((student, index) => (
								<Table.Tr key={`${student.stdNo}-${index}`}>
									{visibleColumns.map((col) => (
										<Table.Td key={col.key} ta={col.align}>
											{col.render(student)}
										</Table.Td>
									))}
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</ScrollArea>

				<Group justify='space-between' wrap='wrap'>
					<Text size='sm' c='dimmed'>
						Showing {data.length} of {totalCount} graduate
						{totalCount !== 1 ? 's' : ''}
					</Text>

					{totalPages > 1 && (
						<Pagination
							total={totalPages}
							value={currentPage}
							onChange={onPageChange}
							size='sm'
						/>
					)}
				</Group>
			</Stack>
		</Paper>
	);
}
