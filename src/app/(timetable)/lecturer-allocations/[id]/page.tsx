'use client';

import {
	Divider,
	Flex,
	Group,
	Select,
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
	deleteLecturerAllocation,
	EditAllocationModal,
	getLecturerAllocationsByUserId,
} from '@timetable/lecturer-allocations';
import { notFound } from 'next/navigation';
import { use, useMemo, useState } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	DeleteButton,
	DetailsView,
	DetailsViewBody,
	FieldView,
} from '@/shared/ui/adease';

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
	const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

	const { data: allocations, isLoading } = useQuery({
		queryKey: ['lecturer-allocations', id],
		queryFn: () => getLecturerAllocationsByUserId(id),
	});

	const filteredAllocations = useMemo(() => {
		if (!allocations) return [];
		if (!selectedTermId) return allocations;
		return allocations.filter(
			(allocation) => allocation.termId === Number(selectedTermId)
		);
	}, [allocations, selectedTermId]);

	const uniqueTerms = useMemo(() => {
		if (!allocations) return [];
		return Array.from(
			new Map(
				allocations
					.filter((a) => a.term?.id && a.term?.name)
					.map((a) => [a.term?.id, a.term])
			).values()
		);
	}, [allocations]);

	const totalMinutes = useMemo(() => {
		return filteredAllocations.reduce(
			(sum, allocation) => sum + (allocation.duration || 0),
			0
		);
	}, [filteredAllocations]);

	if (isLoading) {
		return null;
	}

	if (!allocations || allocations.length === 0) {
		return notFound();
	}

	const lecturer = allocations[0]?.user;

	return (
		<DetailsView>
			<Flex justify='space-between' align='center' gap='md' wrap='wrap'>
				<Title order={3} fw={100}>
					Lecturer Allocations
				</Title>
				<Select
					placeholder='All Terms'
					data={uniqueTerms.map((term) => ({
						value: term.id.toString(),
						label: term.name,
					}))}
					value={selectedTermId}
					onChange={setSelectedTermId}
					clearable
					w={200}
				/>
			</Flex>
			<Divider my={15} />
			<DetailsViewBody>
				<FieldView label='Lecturer'>
					<Text size='lg' fw={500}>
						{lecturer?.name || 'Unknown'}
					</Text>
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
							<TableTh>Term</TableTh>
							<TableTh>Duration</TableTh>
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
									{formatSemester(
										allocation.semesterModule?.semester?.semesterNumber,
										'mini'
									)}
								</TableTd>
								<TableTd>{allocation.term?.name || '-'}</TableTd>
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
									<Group gap={2} wrap='nowrap'>
										<EditAllocationModal
											allocationId={allocation.id}
											currentDuration={allocation.duration || 0}
											currentVenueTypeIds={
												allocation.lecturerAllocationVenueTypes?.map(
													(avt) => avt.venueTypeId
												) || []
											}
										/>
										<DeleteButton
											variant='subtle'
											size='sm'
											handleDelete={async () => {
												await deleteLecturerAllocation(allocation.id);
											}}
											queryKey={['lecturer-allocations', id]}
											message='Are you sure you want to delete this allocation?'
											onSuccess={() => {}}
										/>
									</Group>
								</TableTd>
							</TableTr>
						))}
					</TableTbody>
				</Table>
			</DetailsViewBody>
		</DetailsView>
	);
}
