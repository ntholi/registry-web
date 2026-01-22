'use client';

import { getBookCopies } from '@library/book-copies/_server/actions';
import { Badge, Group, Stack, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/shared/lib/utils/dates';
import BookCopyModal from './BookCopyModal';

type Props = {
	bookId: number;
};

const statusColors: Record<string, string> = {
	Available: 'green',
	OnLoan: 'blue',
	Withdrawn: 'red',
};

const conditionColors: Record<string, string> = {
	New: 'teal',
	Good: 'blue',
	Damaged: 'orange',
};

export default function BookCopiesTab({ bookId }: Props) {
	const { data: copies = [], isLoading } = useQuery({
		queryKey: ['book-copies', String(bookId)],
		queryFn: () => getBookCopies(bookId),
	});

	if (isLoading) {
		return (
			<Text size='sm' c='dimmed'>
				Loading copies...
			</Text>
		);
	}

	return (
		<Stack>
			<Group justify='flex-end'>
				<BookCopyModal bookId={bookId} />
			</Group>

			{copies.length === 0 ? (
				<Text size='sm' c='dimmed' ta='center' py='xl'>
					No copies available for this book.
				</Text>
			) : (
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Serial Number</Table.Th>
							<Table.Th>Condition</Table.Th>
							<Table.Th>Status</Table.Th>
							<Table.Th>Location</Table.Th>
							<Table.Th>Acquired</Table.Th>
							<Table.Th w={50} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{copies.map((copy) => (
							<Table.Tr key={copy.id}>
								<Table.Td>
									<Text size='sm' fw={500}>
										{copy.serialNumber}
									</Text>
								</Table.Td>
								<Table.Td>
									<Badge
										size='sm'
										variant='light'
										color={conditionColors[copy.condition] ?? 'gray'}
									>
										{copy.condition}
									</Badge>
								</Table.Td>
								<Table.Td>
									<Badge
										size='sm'
										variant='light'
										color={statusColors[copy.status] ?? 'gray'}
									>
										{copy.status}
									</Badge>
								</Table.Td>
								<Table.Td>
									<Text size='sm' c='dimmed'>
										{copy.location ?? '-'}
									</Text>
								</Table.Td>
								<Table.Td>
									<Text size='sm' c='dimmed'>
										{copy.acquiredAt ? formatDate(copy.acquiredAt) : '-'}
									</Text>
								</Table.Td>
								<Table.Td>
									<BookCopyModal bookId={bookId} copy={copy} />
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Stack>
	);
}
