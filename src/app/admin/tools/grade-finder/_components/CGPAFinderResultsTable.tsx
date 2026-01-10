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
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import Link from '@/shared/ui/Link';
import type { CGPAFinderResult } from '../_server/cgpa-repository';

interface Props {
	data: CGPAFinderResult[];
	isLoading: boolean;
	total: number;
	pages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	onSearchChange: (search: string) => void;
}

function formatCGPA(cgpa: number) {
	return cgpa.toFixed(2);
}

function getCGPAColor(cgpa: number) {
	if (cgpa >= 3.5) return 'green';
	if (cgpa >= 3.0) return 'teal';
	if (cgpa >= 2.5) return 'blue';
	if (cgpa >= 2.0) return 'yellow';
	return 'red';
}

export function CGPAFinderResultsTable({
	data,
	isLoading,
	total,
	pages,
	currentPage,
	onPageChange,
	onSearchChange,
}: Props) {
	const [searchValue, setSearchValue] = useState('');

	function handleSearchChange(value: string) {
		setSearchValue(value);
		onSearchChange(value);
	}

	if (!data.length && !isLoading) {
		return (
			<Paper withBorder p='md'>
				<Stack gap='md'>
					<TextInput
						placeholder='Search by student name or program...'
						leftSection={<IconSearch size={16} />}
						value={searchValue}
						onChange={(e) => handleSearchChange(e.currentTarget.value)}
						size='sm'
					/>
					<Box py='xl' ta='center'>
						<Text c='dimmed'>
							No results found. Try adjusting your CGPA range or filters.
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
					placeholder='Search by student name or program...'
					leftSection={<IconSearch size={16} />}
					rightSection={isLoading ? <Loader size='xs' /> : null}
					value={searchValue}
					onChange={(e) => handleSearchChange(e.currentTarget.value)}
					size='sm'
				/>

				<ScrollArea>
					<Table striped highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Student No.</Table.Th>
								<Table.Th>Student Name</Table.Th>
								<Table.Th>Program</Table.Th>
								<Table.Th>School</Table.Th>
								<Table.Th ta='center'>GPA</Table.Th>
								<Table.Th ta='center'>CGPA</Table.Th>
								<Table.Th ta='center'>Credits Earned</Table.Th>
								<Table.Th ta='center'>Semesters</Table.Th>
								<Table.Th>Latest Term</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{isLoading
								? Array.from({ length: 10 }).map((_, i) => (
										<Table.Tr key={`skeleton-${i}`}>
											<Table.Td>
												<Skeleton height={14} width={70} />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width='80%' />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width='60%' />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width={50} />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={40} mx='auto' />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={40} mx='auto' />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={40} mx='auto' />
											</Table.Td>
											<Table.Td ta='center'>
												<Skeleton height={14} width={30} mx='auto' />
											</Table.Td>
											<Table.Td>
												<Skeleton height={14} width={70} />
											</Table.Td>
										</Table.Tr>
									))
								: data.map((row) => (
										<Table.Tr key={row.stdNo}>
											<Table.Td>
												<Link
													href={`/registry/students/${row.stdNo}`}
													size='sm'
													fw={500}
												>
													{row.stdNo}
												</Link>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.studentName}</Text>
											</Table.Td>
											<Table.Td>
												<Text size='sm' fw={500}>
													{row.programCode}
												</Text>
												<Text size='xs' c='dimmed' lineClamp={1}>
													{row.programName}
												</Text>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.schoolCode}</Text>
											</Table.Td>
											<Table.Td ta='center'>
												<Text size='sm'>{formatCGPA(row.gpa)}</Text>
											</Table.Td>
											<Table.Td ta='center'>
												<Badge variant='light' color={getCGPAColor(row.cgpa)}>
													{formatCGPA(row.cgpa)}
												</Badge>
											</Table.Td>
											<Table.Td ta='center'>
												<Text size='sm'>
													{row.creditsCompleted}/{row.creditsAttempted}
												</Text>
											</Table.Td>
											<Table.Td ta='center'>
												<Badge variant='light' size='sm'>
													{row.semesterCount}
												</Badge>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{row.latestTermCode}</Text>
											</Table.Td>
										</Table.Tr>
									))}
						</Table.Tbody>
					</Table>
				</ScrollArea>

				<Group justify='space-between' wrap='wrap'>
					<Text size='sm' c='dimmed'>
						Showing {data.length} of {total} result{total !== 1 ? 's' : ''}
					</Text>

					{pages > 1 && (
						<Pagination
							total={pages}
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
