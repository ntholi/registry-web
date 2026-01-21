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
import { useQueryClient } from '@tanstack/react-query';
import { getStudentClassName } from '@/shared/lib/utils/utils';
import { DeleteButton } from '@/shared/ui/adease';
import { formatDuration } from '../../_lib/utils';
import { deleteTimetableAllocation } from '../_server/actions';
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
	const queryClient = useQueryClient();

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
							{allocation.timetableAllocationVenueTypes &&
							allocation.timetableAllocationVenueTypes.length > 0 ? (
								<Group gap='xs'>
									{allocation.timetableAllocationVenueTypes.map((avt) => (
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
									/>
								)}
								<DeleteButton
									variant='subtle'
									size='sm'
									handleDelete={async () => {
										await deleteTimetableAllocation(allocation.id);
									}}
									queryKey={['timetable-allocations', userId]}
									message='Are you sure you want to delete this allocation?'
									onSuccess={async () => {
										await queryClient.invalidateQueries({
											queryKey: ['timetable-slots'],
											refetchType: 'all',
										});
									}}
								/>
							</Group>
						</TableTd>
					</TableTr>
				))}
			</TableTbody>
		</Table>
	);
}
