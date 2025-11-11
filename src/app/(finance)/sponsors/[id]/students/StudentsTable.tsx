'use client';

import {
	Center,
	CloseButton,
	Group,
	Pagination as MPagination,
	Paper,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from '@/components/Link';
import { getSponsoredStudents } from '@/server/sponsors/actions';

type Props = {
	sponsorId: string;
};

export default function StudentsTable({ sponsorId }: Props) {
	const [searchQuery, setSearchQuery] = useState('');
	const [page, setPage] = useState(1);
	const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

	const { data, isLoading } = useQuery({
		queryKey: ['sponsored-students', sponsorId, page, debouncedSearch],
		queryFn: () => getSponsoredStudents(sponsorId, page, debouncedSearch),
	});

	const renderTableHeaders = () => (
		<Table.Thead>
			<Table.Tr>
				<Table.Th>Student Number</Table.Th>
				<Table.Th>Name</Table.Th>
				<Table.Th>Program of Study</Table.Th>
				<Table.Th>Borrower Number</Table.Th>
				<Table.Th>Bank Name</Table.Th>
				<Table.Th>Account Number</Table.Th>
			</Table.Tr>
		</Table.Thead>
	);

	const renderTableRows = () => {
		if (isLoading) {
			return (
				<Table.Tbody>
					{Array.from({ length: 5 }, (_, index) => `skeleton-row-${index}`).map(
						(key) => (
							<Table.Tr key={key}>
								<Table.Td>
									<Skeleton height={20} width={100} />
								</Table.Td>
								<Table.Td>
									<Skeleton height={20} width={150} />
								</Table.Td>
								<Table.Td>
									<Skeleton height={20} width={200} />
								</Table.Td>
								<Table.Td>
									<Skeleton height={20} width={120} />
								</Table.Td>
								<Table.Td>
									<Skeleton height={20} width={120} />
								</Table.Td>
								<Table.Td>
									<Skeleton height={20} width={120} />
								</Table.Td>
							</Table.Tr>
						)
					)}
				</Table.Tbody>
			);
		}

		if (!data?.items || data.items.length === 0) {
			return (
				<Table.Tbody>
					<Table.Tr>
						<Table.Td colSpan={6}>
							<Center p='md'>
								<Text c='dimmed'>
									{searchQuery
										? 'No students match your search.'
										: 'No sponsored students found.'}
								</Text>
							</Center>
						</Table.Td>
					</Table.Tr>
				</Table.Tbody>
			);
		}

		return (
			<Table.Tbody>
				{data.items.map((sponsoredStudent) => {
					const student = sponsoredStudent.student;
					const activeProgram = student?.programs?.find(
						(p) => p.status === 'Active'
					);
					const programName = activeProgram?.structure?.program?.name || 'N/A';

					return (
						<Table.Tr key={sponsoredStudent.id}>
							<Table.Td>
								{student?.stdNo ? (
									<Link size='sm' href={`/students/${student.stdNo}`}>
										{student.stdNo}
									</Link>
								) : (
									<Text size='sm' c='dimmed'>
										N/A
									</Text>
								)}
							</Table.Td>
							<Table.Td>
								<Text size='sm'>{student?.name || 'N/A'}</Text>
							</Table.Td>
							<Table.Td>
								<Text size='sm'>{programName}</Text>
							</Table.Td>
							<Table.Td>
								<Text size='sm'>{sponsoredStudent.borrowerNo || '-'}</Text>
							</Table.Td>
							<Table.Td>
								<Text size='sm'>{sponsoredStudent.bankName || '-'}</Text>
							</Table.Td>
							<Table.Td>
								<Text size='sm'>{sponsoredStudent.accountNumber || '-'}</Text>
							</Table.Td>
						</Table.Tr>
					);
				})}
			</Table.Tbody>
		);
	};

	return (
		<Stack gap='md' p='md'>
			<Group justify='space-between' align='center'>
				<TextInput
					placeholder='Search by name or student number'
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.currentTarget.value)}
					style={{ flex: 1, maxWidth: 400 }}
					rightSection={
						searchQuery ? (
							<CloseButton
								onClick={() => setSearchQuery('')}
								variant='subtle'
								size='sm'
							/>
						) : null
					}
					leftSection={<IconSearch size='1.2rem' />}
				/>
				{!isLoading && data && (
					<Paper withBorder p={8.5}>
						<Text size='xs' c='dimmed' style={{ whiteSpace: 'nowrap' }}>
							{data.items.length} student{data.items.length !== 1 ? 's' : ''}{' '}
							displayed
						</Text>
					</Paper>
				)}
			</Group>

			<Table highlightOnHover withTableBorder>
				{renderTableHeaders()}
				{renderTableRows()}
			</Table>

			{data && data.totalPages > 1 && (
				<Group justify='center'>
					<MPagination
						total={data.totalPages}
						value={page}
						onChange={setPage}
						size='sm'
					/>
				</Group>
			)}
		</Stack>
	);
}
