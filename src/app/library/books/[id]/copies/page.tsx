import { getBookCopies } from '@library/book-copies/_server/actions';
import { Badge, Button, Group, Stack, Table, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
	getBookCopyStatusColor,
	getConditionColor,
} from '@/shared/lib/utils/colors';
import { getBook } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BookCopiesPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(Number(id));

	if (!book) return notFound();

	const copies = await getBookCopies(Number(id));

	return (
		<Stack p='lg'>
			<Group justify='space-between'>
				<Text fw={500} size='lg'>
					Copies of "{book.title}"
				</Text>
				<Button
					component={Link}
					href={`/library/books/${id}/copies/new`}
					leftSection={<IconPlus size={16} />}
					size='sm'
				>
					Add Copy
				</Button>
			</Group>
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Serial Number</Table.Th>
						<Table.Th>Condition</Table.Th>
						<Table.Th>Status</Table.Th>
						<Table.Th>Location</Table.Th>
						<Table.Th>Actions</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{copies.map((copy) => (
						<Table.Tr key={copy.id}>
							<Table.Td>{copy.serialNumber}</Table.Td>
							<Table.Td>
								<Badge color={getConditionColor(copy.condition)}>
									{copy.condition}
								</Badge>
							</Table.Td>
							<Table.Td>
								<Badge color={getBookCopyStatusColor(copy.status)}>
									{copy.status}
								</Badge>
							</Table.Td>
							<Table.Td>{copy.location}</Table.Td>
							<Table.Td>
								<Button
									component={Link}
									href={`/library/book-copies/${copy.id}`}
									size='xs'
									variant='subtle'
								>
									View
								</Button>
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</Stack>
	);
}
