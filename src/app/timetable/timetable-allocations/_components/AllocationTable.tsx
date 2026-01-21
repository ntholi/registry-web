'use client';

import {
	Center,
	Group,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
} from '@mantine/core';
import { formatDuration } from '@/shared/lib/utils/dates';
import { getStudentClassName } from '@/shared/lib/utils/utils';
import DeleteAllocationButton from './DeleteAllocationButton';
import EditAllocationModal from './EditAllocationModal';

export type AllocationData = {
	id: number;
	duration: number | null;
	classType: 'lecture' | 'tutorial' | 'lab' | 'workshop' | 'practical' | null;
	numberOfStudents: number | null;
	groupName: string | null;
	allowedDays:
		| (
				| 'monday'
				| 'tuesday'
				| 'wednesday'
				| 'thursday'
				| 'friday'
				| 'saturday'
				| 'sunday'
		  )[]
		| null;
	startTime: string | null;
	endTime: string | null;
	semesterModule: {
		semester: {
			semesterNumber: string;
			structure: {
				program: {
					code: string;
				};
			};
		} | null;
		module: {
			name: string;
			code: string;
		};
	};
	timetableAllocationVenueTypes?: {
		venueTypeId: string;
		venueType: {
			name: string;
		};
	}[];
	timetableAllocationAllowedVenues?: {
		venueId: string;
		venue: {
			id: string;
			name: string;
		};
	}[];
	timetableSlotAllocations?: {
		slot: {
			venue: {
				id: string;
				name: string;
			};
		};
	}[];
};

type Defaults = {
	duration?: number;
	allowedDays?: (
		| 'monday'
		| 'tuesday'
		| 'wednesday'
		| 'thursday'
		| 'friday'
		| 'saturday'
		| 'sunday'
	)[];
	startTime?: string;
	endTime?: string;
};

type Props = {
	allocations: AllocationData[];
	userId: string;
	defaults?: Defaults;
	showEdit?: boolean;
	emptyMessage?: string;
};

export default function AllocationTable({
	allocations,
	userId,
	defaults,
	showEdit = true,
	emptyMessage = 'No allocations found.',
}: Props) {
	if (allocations.length === 0) {
		return (
			<Center h={200}>
				<Text size='sm' c='dimmed'>
					{emptyMessage}
				</Text>
			</Center>
		);
	}

	return (
		<Table striped highlightOnHover withTableBorder>
			<TableThead>
				<TableTr>
					<TableTh>Module</TableTh>
					<TableTh>Class</TableTh>
					<TableTh>Duration</TableTh>
					<TableTh>Students</TableTh>
					<TableTh>Venue</TableTh>
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
							{getStudentClassName(
								allocation.semesterModule.semester,
								allocation.groupName
							)}
						</TableTd>
						<TableTd>{formatDuration(allocation.duration || 0)}</TableTd>
						<TableTd>
							<Text size='sm'>{allocation.numberOfStudents}</Text>
						</TableTd>
						<TableTd>
							{allocation.timetableSlotAllocations &&
							allocation.timetableSlotAllocations.length > 0 ? (
								<Text size='sm'>
									{[
										...new Set(
											allocation.timetableSlotAllocations.map(
												(sa) => sa.slot.venue.name
											)
										),
									].join(', ')}
								</Text>
							) : (
								<Text size='sm' c='dimmed'>
									-
								</Text>
							)}
						</TableTd>

						<TableTd>
							<Group gap={2} wrap='nowrap'>
								{showEdit && (
									<EditAllocationModal
										allocationId={allocation.id}
										currentDuration={
											allocation.duration || defaults?.duration || 120
										}
										currentClassType={allocation.classType || 'lecture'}
										currentNumberOfStudents={allocation.numberOfStudents ?? 0}
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
											allocation.startTime || defaults?.startTime || '08:30:00'
										}
										currentEndTime={
											allocation.endTime || defaults?.endTime || '17:30:00'
										}
										currentAllowedVenueIds={
											allocation.timetableAllocationAllowedVenues?.map(
												(av) => av.venueId
											) || []
										}
									/>
								)}
								<DeleteAllocationButton
									allocation={allocation}
									allAllocations={allocations}
									userId={userId}
								/>
							</Group>
						</TableTd>
					</TableTr>
				))}
			</TableTbody>
		</Table>
	);
}
