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
import { IconTrash } from '@tabler/icons-react';
import {
	deleteLecturerAllocation,
	getLecturerAllocationsByUserId,
} from '@timetable/lecturer-allocations';
import { notFound } from 'next/navigation';
import { formatSemester } from '@/shared/lib/utils/utils';
import { DetailsView, DetailsViewBody, FieldView } from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

function formatDuration(totalMinutes: number): string {
	if (totalMinutes <= 0) return '0 hours';
	const hours = Math.floor(totalMinutes / 60);
	const mins = totalMinutes % 60;

	if (hours === 0) {
		return `${mins} minute${mins !== 1 ? 's' : ''}`;
	}
	if (mins === 0) {
		return `${hours} hour${hours !== 1 ? 's' : ''}`;
	}
	return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
}

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

	const totalMinutes = allocations.reduce(
		(sum, allocation) => sum + (allocation.duration || 0),
		0
	);

	return (
		<DetailsView>
			<Flex justify='space-between' align='center'>
				<Title order={3} fw={100}>
					Lecturer Allocations
				</Title>
			</Flex>
			<Divider my={15} />
			<DetailsViewBody>
				<FieldView label='Lecturer'>
					<Text size='lg' fw={500}>
						{lecturer?.name || 'Unknown'}
					</Text>
				</FieldView>

				<FieldView label='Terms'>
					<Group gap='xs'>
						{uniqueTerms.map((termName) => (
							<Text key={termName}>{termName}</Text>
						))}
					</Group>
				</FieldView>

				<FieldView label='Total Hours'>
					<Text size='lg' fw={500}>
						{formatDuration(totalMinutes)}
					</Text>
				</FieldView>

				<Table striped highlightOnHover withTableBorder mt={'lg'}>
					<TableThead>
						<TableTr>
							<TableTh>Module</TableTh>
							<TableTh>Program</TableTh>
							<TableTh>Semester</TableTh>
							<TableTh>Duration</TableTh>
							<TableTh>Venue Types</TableTh>
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
								<TableTd>{formatDuration(allocation.duration || 0)}</TableTd>
								<TableTd>
									{allocation.lecturerAllocationVenueTypes &&
									allocation.lecturerAllocationVenueTypes.length > 0 ? (
										<Group gap='xs'>
											{allocation.lecturerAllocationVenueTypes.map((avt) => (
												<Text key={avt.venueTypeId} size='sm'>
													{avt.venueType?.name}
												</Text>
											))}
										</Group>
									) : (
										<Text size='sm' c='dimmed'>
											-
										</Text>
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
