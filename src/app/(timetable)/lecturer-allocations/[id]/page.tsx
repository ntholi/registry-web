import {
	ActionIcon,
	Divider,
	Flex,
	Group,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
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
import { formatSemester } from '@/shared/lib/utils/utils';
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

	const uniqueTerms = Array.from(
		new Set(allocations.map((a) => a.term?.name).filter(Boolean))
	);

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
				<div>
					<Text size='sm' c='dimmed'>
						Lecturer
					</Text>
					<Text size='lg' fw={500}>
						{lecturer?.name || 'Unknown'}
					</Text>
				</div>

				<div>
					<Text size='sm' c='dimmed' mb={4}>
						Terms
					</Text>
					<Group gap='xs'>
						{uniqueTerms.map((termName) => (
							<Text key={termName}>{termName}</Text>
						))}
					</Group>
				</div>

				<Table striped highlightOnHover withTableBorder>
					<TableThead>
						<TableTr>
							<TableTh>Module</TableTh>
							<TableTh>Program</TableTh>
							<TableTh>Semester</TableTh>
							<TableTh>Actions</TableTh>
						</TableTr>
					</TableThead>
					<TableTbody>
						{allocations.map((allocation) => (
							<TableTr key={allocation.id}>
								<TableTd>
									{allocation.semesterModule?.module?.name} (
									{allocation.semesterModule?.module?.code})
								</TableTd>
								<TableTd>
									{allocation.semesterModule?.semester?.structure?.program
										?.name || '-'}
								</TableTd>
								<TableTd>
									{formatSemester(
										allocation.semesterModule?.semester?.semesterNumber,
										'mini'
									)}
								</TableTd>
								<TableTd>
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
								</TableTd>
							</TableTr>
						))}
					</TableTbody>
				</Table>
			</DetailsViewBody>
		</DetailsView>
	);
}
