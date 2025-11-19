'use client';

import {
	Badge,
	Box,
	Center,
	Flex,
	Group,
	Stack,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
} from '@mantine/core';
import {
	AddAllocationModal,
	deleteTimetableAllocation,
	EditAllocationModal,
} from '@timetable/timetable-allocations';
import type useConfigDefaults from '@/shared/lib/hooks/use-config-defaults';
import { formatSemester } from '@/shared/lib/utils/utils';
import { DeleteButton, FieldView } from '@/shared/ui/adease';

type Props = {
	filteredAllocations: {
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
			venueTypeId: number;
			venueType: {
				name: string;
			};
		}[];
	}[];
	userId: string;
	selectedTermId: number | null;
	termName: string | undefined;
	totalMinutes: number;
	totalStudents: number;
	defaults: ReturnType<typeof useConfigDefaults>['defaults'];
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

function toClassName(
	semesterModule: {
		semester: {
			semesterNumber: string;
			structure: {
				program: {
					code: string;
				};
			};
		} | null;
	},
	groupName: string | null
) {
	if (!semesterModule.semester) return 'Unknown';
	const code = semesterModule.semester.structure?.program?.code;
	const num = semesterModule.semester.semesterNumber;
	return `${code}${formatSemester(num, 'mini')}${groupName ? `${groupName}` : ''}`;
}

export default function AllocationTab({
	filteredAllocations,
	userId,
	selectedTermId,
	termName,
	totalMinutes,
	totalStudents,
	defaults,
}: Props) {
	return (
		<Box>
			<Stack gap={'lg'}>
				<FieldView label='Term'>{termName}</FieldView>
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
						userId={userId}
						termId={selectedTermId!}
						defaultDuration={defaults?.duration}
						defaultAllowedDays={defaults?.allowedDays}
						defaultStartTime={defaults?.startTime}
						defaultEndTime={defaults?.endTime}
					/>
				</Flex>

				{filteredAllocations.length === 0 ? (
					<Center h={200}>
						<Text size='sm' c='dimmed'>
							No allocations found for this term. Click &quot;Add&quot; button
							to create one.
						</Text>
					</Center>
				) : (
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
							{filteredAllocations.map((allocation) => (
								<TableTr key={allocation.id}>
									<TableTd>
										{allocation.semesterModule?.module?.name} (
										{allocation.semesterModule?.module?.code})
									</TableTd>
									<TableTd>
										{toClassName(
											allocation.semesterModule,
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
											<EditAllocationModal
												allocationId={allocation.id}
												currentDuration={
													allocation.duration || defaults?.duration || 120
												}
												currentClassType={allocation.classType || 'lecture'}
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
													allocation.endTime || defaults?.endTime || '17:30:00'
												}
											/>
											<DeleteButton
												variant='subtle'
												size='sm'
												handleDelete={async () => {
													await deleteTimetableAllocation(allocation.id);
												}}
												queryKey={['timetable-allocations', userId]}
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
		</Box>
	);
}
