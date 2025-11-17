'use client';

import { getLecturer } from '@academic/lecturers';
import {
	Badge,
	Box,
	Center,
	Divider,
	Flex,
	Group,
	Select,
	Stack,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
	AddAllocationModal,
	deleteTimetableAllocation,
	EditAllocationModal,
	getTimetableAllocationsByUserId,
} from '@timetable/timetable-allocations';
import { useAtom } from 'jotai';
import { notFound } from 'next/navigation';
import { use, useMemo } from 'react';
import { getAllTerms } from '@/modules/registry/features/terms';
import useConfigDefaults from '@/shared/lib/hooks/use-config-defaults';
import {
	DeleteButton,
	DetailsView,
	DetailsViewBody,
	FieldView,
} from '@/shared/ui/adease';
import { selectedTermAtom } from '@/shared/ui/atoms/termAtoms';

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

export default function LecturerAllocationDetails({ params }: Props) {
	const { id } = use(params);
	const [selectedTermId, setSelectedTermId] = useAtom(selectedTermAtom);

	const { data: lecturer, isLoading: lecturerLoading } = useQuery({
		queryKey: ['lecturer', id],
		queryFn: () => getLecturer(id),
	});

	const { data: allocations = [], isLoading: allocationsLoading } = useQuery({
		queryKey: ['timetable-allocations', id],
		queryFn: () => getTimetableAllocationsByUserId(id),
	});

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: async () => getAllTerms(),
	});

	const { defaults } = useConfigDefaults();

	const filteredAllocations = useMemo(() => {
		if (!selectedTermId) return [];
		return allocations.filter(
			(allocation) => allocation.termId === selectedTermId
		);
	}, [allocations, selectedTermId]);

	const totalMinutes = useMemo(() => {
		return filteredAllocations.reduce(
			(sum, allocation) => sum + (allocation.duration || 0),
			0
		);
	}, [filteredAllocations]);

	const totalStudents = useMemo(() => {
		return filteredAllocations.reduce(
			(sum, allocation) => sum + (allocation.numberOfStudents ?? 0),
			0
		);
	}, [filteredAllocations]);

	if (lecturerLoading || allocationsLoading) {
		return null;
	}

	if (!lecturer) {
		return notFound();
	}

	return (
		<DetailsView>
			<Flex justify='space-between' align='center' gap='md' wrap='wrap'>
				<Title order={3} fw={100}>
					Timetable Allocations
				</Title>
				<Select
					placeholder='Select a term'
					data={terms.map((term) => ({
						value: term.id.toString(),
						label: term.name,
					}))}
					value={selectedTermId ? selectedTermId.toString() : null}
					onChange={(value) => {
						if (value) {
							setSelectedTermId(Number(value));
						} else {
							setSelectedTermId(null);
						}
					}}
					clearable
					w={200}
				/>
			</Flex>
			<Divider my={15} />
			{!selectedTermId ? (
				<Center h={400}>
					<Stack align='center' gap='md'>
						<Text>Please select a term to view allocations</Text>
					</Stack>
				</Center>
			) : (
				<DetailsViewBody gap={'sm'}>
					<Stack gap={'lg'}>
						<FieldView label='Lecturer'>{lecturer.name}</FieldView>
					</Stack>
					<Box mt='lg'>
						<Flex justify='space-between' align={'flex-end'} mb='xs'>
							<Group align='center' gap='xs'>
								<Badge variant='light' color='cyan' radius={'sm'}>
									{formatDuration(totalMinutes)}
								</Badge>
								<Badge variant='light' color='teal' radius={'sm'}>
									{`${totalStudents} Student${totalStudents !== 1 ? 's' : ''}`}
								</Badge>
							</Group>
							<AddAllocationModal
								userId={id}
								termId={selectedTermId}
								defaultDuration={defaults?.duration}
								defaultAllowedDays={defaults?.allowedDays}
								defaultStartTime={defaults?.startTime}
								defaultEndTime={defaults?.endTime}
							/>
						</Flex>

						{filteredAllocations.length === 0 ? (
							<Center h={200}>
								<Text size='sm' c='dimmed'>
									No allocations found for this term. Click &quot;Add&quot;
									button to create one.
								</Text>
							</Center>
						) : (
							<Table striped highlightOnHover withTableBorder>
								<TableThead>
									<TableTr>
										<TableTh>Module</TableTh>
										<TableTh>Program</TableTh>
										<TableTh>Group</TableTh>
										<TableTh>Duration</TableTh>
										<TableTh>Students</TableTh>
										<TableTh>Venue</TableTh>
										<TableTh>Actions</TableTh>
									</TableTr>
								</TableThead>
								<TableTbody>
									{filteredAllocations.map((allocation) => (
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
												{allocation.groupName ? (
													<Badge variant='light' size='sm'>
														{allocation.groupName}
													</Badge>
												) : (
													<Text size='sm' c='dimmed'>
														All Students
													</Text>
												)}
											</TableTd>
											<TableTd>
												{formatDuration(allocation.duration || 0)}
											</TableTd>
											<TableTd>
												<Text size='sm'>{allocation.numberOfStudents}</Text>
											</TableTd>
											<TableTd>
												{allocation.timetableAllocationVenueTypes &&
												allocation.timetableAllocationVenueTypes.length > 0 ? (
													<Group gap='xs'>
														{allocation.timetableAllocationVenueTypes.map(
															(avt) => (
																<Text key={avt.venueTypeId} size='sm'>
																	{avt.venueType?.name}
																</Text>
															)
														)}
													</Group>
												) : (
													<Text size='sm' c='dimmed'>
														-
													</Text>
												)}
											</TableTd>
											<TableTd>
												<Group gap={2} wrap='nowrap'>
													<EditAllocationModal
														allocationId={allocation.id}
														currentDuration={
															allocation.duration || defaults?.duration || 120
														}
														currentNumberOfStudents={
															allocation.numberOfStudents ?? 0
														}
														currentVenueTypeIds={
															allocation.timetableAllocationVenueTypes?.map(
																(avt) => avt.venueTypeId
															) || []
														}
														currentAllowedDays={
															allocation.allowedDays ||
															defaults?.allowedDays || [
																'monday',
																'tuesday',
																'wednesday',
																'thursday',
																'friday',
															]
														}
														currentStartTime={
															allocation.startTime ||
															defaults?.startTime ||
															'08:30:00'
														}
														currentEndTime={
															allocation.endTime ||
															defaults?.endTime ||
															'17:30:00'
														}
													/>
													<DeleteButton
														variant='subtle'
														size='sm'
														handleDelete={async () => {
															await deleteTimetableAllocation(allocation.id);
														}}
														queryKey={['timetable-allocations', id]}
														message='Are you sure you want to delete this allocation?'
														onSuccess={() => {}}
													/>
												</Group>
											</TableTd>
										</TableTr>
									))}
								</TableTbody>
							</Table>
						)}
					</Box>
				</DetailsViewBody>
			)}
		</DetailsView>
	);
}
