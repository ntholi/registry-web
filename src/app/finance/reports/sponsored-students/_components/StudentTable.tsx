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

interface SponsoredStudent {
	stdNo: number;
	name: string;
	schoolCode: string;
	programName: string;
	semesterNumber: string;
	sponsorName: string;
	borrowerNo: string | null;
	bankName: string | null;
	accountNumber: string | null;
	confirmed: boolean;
}

interface Props {
	data: SponsoredStudent[];
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
						<Table horizontalSpacing='md' verticalSpacing='sm'>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Std No.</Table.Th>
									<Table.Th>Name</Table.Th>
									<Table.Th>School</Table.Th>
									<Table.Th>Program</Table.Th>
									<Table.Th ta='center'>Semester</Table.Th>
									<Table.Th>Sponsor</Table.Th>
									<Table.Th>Borrower No.</Table.Th>
									<Table.Th>Bank Name</Table.Th>
									<Table.Th>Account No.</Table.Th>
									<Table.Th ta='center'>Confirmed</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{Array.from(
									{ length: rowCount },
									(_, i) => `skeleton-row-${i}`
								).map((key) => (
									<Table.Tr key={key}>
										<Table.Td>
											<Skeleton height={14} width={70} />
										</Table.Td>
										<Table.Td>
											<Skeleton height={14} width='60%' />
										</Table.Td>
										<Table.Td>
											<Skeleton height={14} width={40} />
										</Table.Td>
										<Table.Td>
											<Skeleton height={14} width='70%' />
										</Table.Td>
										<Table.Td ta='center'>
											<Skeleton height={18} width={50} radius='sm' />
										</Table.Td>
										<Table.Td>
											<Skeleton height={14} width={60} />
										</Table.Td>
										<Table.Td>
											<Skeleton height={14} width={80} />
										</Table.Td>
										<Table.Td>
											<Skeleton height={14} width={80} />
										</Table.Td>
										<Table.Td>
											<Skeleton height={14} width={80} />
										</Table.Td>
										<Table.Td ta='center'>
											<Skeleton height={18} width={40} radius='sm' />
										</Table.Td>
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
								: 'No sponsored students found'}
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
					placeholder='Search by student number, name, or borrower number...'
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
								<Table.Th miw={90}>Std No.</Table.Th>
								<Table.Th miw={isMobile ? 140 : 180}>Name</Table.Th>
								<Table.Th miw={60}>School</Table.Th>
								<Table.Th miw={isMobile ? 140 : 200}>Program</Table.Th>
								<Table.Th ta='center' miw={80}>
									Semester
								</Table.Th>
								<Table.Th miw={100}>Sponsor</Table.Th>
								<Table.Th miw={100}>Borrower No.</Table.Th>
								<Table.Th miw={100}>Bank Name</Table.Th>
								<Table.Th miw={110}>Account No.</Table.Th>
								<Table.Th ta='center' miw={80}>
									Confirmed
								</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{data.map((student, index) => (
								<Table.Tr key={`${student.stdNo}-${index}`}>
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
										<Text size='sm' fw={500}>
											{student.schoolCode}
										</Text>
									</Table.Td>
									<Table.Td>
										<Text size='sm' c='dimmed'>
											{student.programName}
										</Text>
									</Table.Td>
									<Table.Td ta='center'>
										<Badge variant='light' size='sm'>
											{formatSemester(student.semesterNumber, 'mini')}
										</Badge>
									</Table.Td>
									<Table.Td>
										<Text size='sm'>{student.sponsorName}</Text>
									</Table.Td>
									<Table.Td>
										<Text size='sm' c='dimmed'>
											{student.borrowerNo || '-'}
										</Text>
									</Table.Td>
									<Table.Td>
										<Text size='sm' c='dimmed'>
											{student.bankName || '-'}
										</Text>
									</Table.Td>
									<Table.Td>
										<Text size='sm' c='dimmed'>
											{student.accountNumber || '-'}
										</Text>
									</Table.Td>
									<Table.Td ta='center'>
										<Badge
											variant='light'
											size='sm'
											color={student.confirmed ? 'green' : 'yellow'}
										>
											{student.confirmed ? 'Yes' : 'No'}
										</Badge>
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
