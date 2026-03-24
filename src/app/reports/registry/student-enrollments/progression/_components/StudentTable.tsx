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
import { formatSemester } from '@/shared/lib/utils/utils';
import Link from '@/shared/ui/Link';
import type {
	ProgressionCategory,
	ProgressionStudent,
} from '../_server/repository';

const CATEGORY_COLORS: Record<ProgressionCategory, string> = {
	Progressed: 'green',
	Remained: 'orange',
	'Not Enrolled': 'red',
	Graduated: 'blue',
	'Dropped Out': 'pink',
	Deferred: 'yellow',
	'Terminated/Suspended': 'gray',
};

interface Props {
	data: ProgressionStudent[];
	isLoading: boolean;
	totalCount?: number;
	currentPage?: number;
	totalPages?: number;
	onPageChange?: (page: number) => void;
	searchQuery?: string;
	onSearchChange?: (query: string) => void;
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
}: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const showInitialLoader = isLoading && !data;

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
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Student No.</Table.Th>
									<Table.Th>Name</Table.Th>
									<Table.Th>Program</Table.Th>
									<Table.Th ta='center'>Prev Sem</Table.Th>
									<Table.Th ta='center'>Curr Sem</Table.Th>
									<Table.Th ta='center'>Category</Table.Th>
									<Table.Th>School</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{Array.from({ length: rowCount }, (_, i) => `sk-${i}`).map(
									(k) => (
										<Table.Tr key={k}>
											<Table.Td>
												<Skeleton height={14} width={70} />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width='60%' />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width='60%' />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={50} />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={50} />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={70} />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width={50} />
											</Table.Td>
										</Table.Tr>
									)
								)}
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
						onChange={(e) => onSearchChange?.(e.currentTarget.value)}
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
					onChange={(e) => onSearchChange?.(e.currentTarget.value)}
					size='sm'
				/>

				<ScrollArea>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th miw={90}>Student No.</Table.Th>
								<Table.Th miw={200}>Name</Table.Th>
								<Table.Th miw={200}>Program</Table.Th>
								<Table.Th ta='center' miw={80}>
									Prev Sem
								</Table.Th>
								<Table.Th ta='center' miw={80}>
									Curr Sem
								</Table.Th>
								<Table.Th ta='center' miw={120}>
									Category
								</Table.Th>
								<Table.Th miw={80}>School</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{data.map((student) => (
								<Table.Tr key={`${student.stdNo}-${student.category}`}>
									<Table.Td>
										<Link
											href={`/registry/students/${student.stdNo}`}
											size='sm'
											fw={500}
										>
											{student.stdNo}
										</Link>
									</Table.Td>
									<Table.Td>
										<Text size='sm'>{student.name}</Text>
									</Table.Td>
									<Table.Td>
										<Text size='sm' c='dimmed'>
											{student.programName}
										</Text>
									</Table.Td>
									<Table.Td ta='center'>
										<Badge variant='light' size='sm'>
											{formatSemester(student.previousSemester, 'mini')}
										</Badge>
									</Table.Td>
									<Table.Td ta='center'>
										{student.currentSemester ? (
											<Badge variant='light' size='sm' color='teal'>
												{formatSemester(student.currentSemester, 'mini')}
											</Badge>
										) : (
											<Text size='sm' c='dimmed'>
												-
											</Text>
										)}
									</Table.Td>
									<Table.Td ta='center'>
										<Badge
											variant='light'
											size='sm'
											color={CATEGORY_COLORS[student.category]}
										>
											{student.category}
										</Badge>
									</Table.Td>
									<Table.Td>
										<Text size='sm' fw={500}>
											{student.schoolCode}
										</Text>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</ScrollArea>

				<Group justify='space-between' wrap='wrap'>
					<Text size='sm' c='dimmed'>
						Showing {data.length} of {totalCount} student
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
