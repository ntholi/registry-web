import {
	ActionIcon,
	Badge,
	Divider,
	Flex,
	Group,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import {
	deleteLecturerAllocation,
	getLecturerAllocationsByUserId,
} from '@timetable/lecturer-allocations';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewBody } from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function LecturerAllocationDetails({ params }: Props) {
	const { id } = await params;
	const allocations = await getLecturerAllocationsByUserId(id);

	if (!allocations || allocations.length === 0) {
		return notFound();
	}

	const lecturer = allocations[0]?.user;

	return (
		<DetailsView>
			<Flex justify='space-between' align='center'>
				<Title order={3} fw={100}>
					Lecturer Allocations
				</Title>
				<Link href={`/lecturer-allocations/new?userId=${id}`}>
					<ActionIcon variant='outline' size='lg'>
						<IconPlus size='1.2rem' />
					</ActionIcon>
				</Link>
			</Flex>
			<Divider my={15} />
			<DetailsViewBody>
				<Stack gap='md'>
					<div>
						<Text size='sm' c='dimmed'>
							Lecturer
						</Text>
						<Group gap='xs'>
							<Text size='lg' fw={500}>
								{lecturer?.name || 'Unknown'}
							</Text>
							{lecturer?.email && (
								<Badge variant='light'>{lecturer.email}</Badge>
							)}
						</Group>
					</div>

					<Table striped highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Module Code</Table.Th>
								<Table.Th>Module Name</Table.Th>
								<Table.Th>Term</Table.Th>
								<Table.Th>Program</Table.Th>
								<Table.Th>Semester</Table.Th>
								<Table.Th>Actions</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{allocations.map((allocation) => (
								<Table.Tr key={allocation.id}>
									<Table.Td>
										{allocation.semesterModule?.module?.code || '-'}
									</Table.Td>
									<Table.Td>
										{allocation.semesterModule?.module?.name || '-'}
									</Table.Td>
									<Table.Td>{allocation.term?.name || '-'}</Table.Td>
									<Table.Td>
										{allocation.semesterModule?.semester?.structure?.program
											?.name || '-'}
									</Table.Td>
									<Table.Td>
										{allocation.semesterModule?.semester?.name || '-'}
									</Table.Td>
									<Table.Td>
										<form
											action={async () => {
												'use server';
												await deleteLecturerAllocation(allocation.id);
											}}
										>
											<ActionIcon
												type='submit'
												variant='subtle'
												color='red'
												size='sm'
											>
												<IconTrash size={16} />
											</ActionIcon>
										</form>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
