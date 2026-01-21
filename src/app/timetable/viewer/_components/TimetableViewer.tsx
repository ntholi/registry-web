'use client';

import { getLecturers } from '@academic/lecturers';
import {
	Badge,
	Box,
	Center,
	Group,
	Paper,
	SegmentedControl,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import TimetableGrid from '@timetable/_shared/components/TimetableGrid';
import { getAllVenues } from '@timetable/venues';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { getAllTerms } from '@/app/registry/terms';
import { getStudentClassName } from '@/shared/lib/utils/utils';
import {
	getClassesWithTimetable,
	getClassTimetableSlots,
	getLecturerTimetableSlots,
	getVenueTimetableSlots,
} from '../_server/actions';

type ViewType = 'lecturers' | 'venues' | 'students';

export default function TimetableViewer() {
	const [termId, setTermId] = useQueryState('term', parseAsInteger);
	const [viewType, setViewType] = useQueryState(
		'view',
		parseAsString.withDefault('lecturers')
	);
	const [lecturerId, setLecturerId] = useQueryState('lecturer', parseAsString);
	const [venueId, setVenueId] = useQueryState('venue', parseAsString);
	const [classId, setClassId] = useQueryState('class', parseAsInteger);

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getAllTerms(),
	});

	const { data: lecturersData } = useQuery({
		queryKey: ['lecturers-select'],
		queryFn: () => getLecturers(1, ''),
	});

	const { data: venues = [] } = useQuery({
		queryKey: ['venues-select'],
		queryFn: () => getAllVenues(),
	});

	const { data: classes = [] } = useQuery({
		queryKey: ['classes-for-term', termId],
		queryFn: () => getClassesWithTimetable(termId!),
		enabled: !!termId,
	});

	const lecturers = lecturersData?.items ?? [];

	const selectedClass = classes.find((cls) => cls.semesterId === classId);

	const { data: lecturerSlots = [], isLoading: isLoadingLecturer } = useQuery({
		queryKey: ['lecturer-timetable', lecturerId, termId],
		queryFn: () => getLecturerTimetableSlots(lecturerId!, termId!),
		enabled: !!lecturerId && !!termId,
	});

	const { data: venueSlots = [], isLoading: isLoadingVenue } = useQuery({
		queryKey: ['venue-timetable', venueId, termId],
		queryFn: () => getVenueTimetableSlots(venueId!, termId!),
		enabled: !!venueId && !!termId,
	});

	const { data: classSlots = [], isLoading: isLoadingClass } = useQuery({
		queryKey: ['class-timetable', classId, termId],
		queryFn: () => getClassTimetableSlots(classId!, termId!),
		enabled: !!classId && !!termId,
	});

	const latestTermId = termId ?? terms[0]?.id;

	if (!termId && latestTermId) {
		setTermId(latestTermId);
	}

	function getEntitySelect() {
		switch (viewType) {
			case 'lecturers':
				return (
					<Select
						placeholder='Select lecturer'
						size='sm'
						searchable
						data={lecturers.map((lecturer) => ({
							value: lecturer.id,
							label: lecturer.name ?? lecturer.email ?? 'Unknown',
						}))}
						value={lecturerId}
						onChange={(value) => setLecturerId(value)}
						clearable
						w={220}
					/>
				);
			case 'venues':
				return (
					<Select
						placeholder='Select venue'
						size='sm'
						searchable
						data={venues.map((venue) => ({
							value: venue.id,
							label: venue.name,
						}))}
						value={venueId}
						onChange={(value) => setVenueId(value)}
						clearable
						w={220}
					/>
				);
			case 'students':
				return (
					<Select
						placeholder='Select class'
						size='sm'
						searchable
						data={classes.map((cls) => ({
							value: cls.semesterId.toString(),
							label: getStudentClassName({
								semesterNumber: cls.semesterNumber,
								structure: { program: { code: cls.programCode } },
							}),
						}))}
						value={classId ? classId.toString() : null}
						onChange={(value) => setClassId(value ? Number(value) : null)}
						clearable
						w={220}
					/>
				);
		}
	}

	function getSelectedEntity() {
		switch (viewType) {
			case 'lecturers':
				return lecturerId;
			case 'venues':
				return venueId;
			case 'students':
				return classId;
		}
	}

	function renderClassTimetables() {
		if (!selectedClass) {
			return (
				<Center h={400}>
					<Text c='dimmed'>Select a class to view timetable</Text>
				</Center>
			);
		}

		const baseClassName = getStudentClassName({
			semesterNumber: selectedClass.semesterNumber,
			structure: { program: { code: selectedClass.programCode } },
		});

		if (selectedClass.groupNames.length === 0) {
			return (
				<Box>
					<Badge
						variant='default'
						radius={0}
						p={'md'}
						mb={0}
						ml={'xl'}
					>{`${baseClassName}`}</Badge>

					<TimetableGrid
						slots={classSlots}
						isLoading={isLoadingClass}
						emptyMessage='No timetable found for this class.'
						showVenue
						showClass={false}
						showLecturer
					/>
				</Box>
			);
		}

		return (
			<Stack gap='lg'>
				{selectedClass.groupNames.map((groupName) => {
					const groupSlots = classSlots.filter((slot) =>
						slot.timetableSlotAllocations.some(
							(sa) =>
								sa.timetableAllocation.groupName === groupName ||
								!sa.timetableAllocation.groupName
						)
					);

					return (
						<Box key={groupName}>
							<Badge
								variant='default'
								radius={0}
								p={'md'}
								mb={0}
								ml={'xl'}
							>{`${baseClassName}${groupName}`}</Badge>
							<TimetableGrid
								slots={groupSlots}
								isLoading={isLoadingClass}
								emptyMessage={`No timetable found for ${baseClassName}${groupName}.`}
								showVenue
								showClass={false}
								showLecturer
							/>
						</Box>
					);
				})}
			</Stack>
		);
	}

	function renderTimetable() {
		if (!termId) {
			return (
				<Center h={400}>
					<Text c='dimmed'>Please select a term to view timetables</Text>
				</Center>
			);
		}

		if (!getSelectedEntity()) {
			const entityName =
				viewType === 'lecturers'
					? 'lecturer'
					: viewType === 'venues'
						? 'venue'
						: 'class';
			return (
				<Center h={400}>
					<Text c='dimmed'>Select a {entityName} to view timetable</Text>
				</Center>
			);
		}

		switch (viewType) {
			case 'lecturers':
				return (
					<TimetableGrid
						slots={lecturerSlots}
						isLoading={isLoadingLecturer}
						emptyMessage='No timetable found for this lecturer.'
						showVenue
						showClass
						showLecturer={false}
					/>
				);
			case 'venues':
				return (
					<TimetableGrid
						slots={venueSlots}
						isLoading={isLoadingVenue}
						emptyMessage='No timetable found for this venue.'
						showVenue={false}
						showClass
						showLecturer
					/>
				);
			case 'students':
				return renderClassTimetables();
		}
	}

	return (
		<Stack gap='lg' p='md'>
			<Paper p='md' withBorder>
				<Group justify='space-between' align='center'>
					<SegmentedControl
						value={viewType ?? 'lecturers'}
						onChange={(value) => setViewType(value as ViewType)}
						data={[
							{ label: 'Lecturers', value: 'lecturers' },
							{ label: 'Venues', value: 'venues' },
							{ label: 'Students', value: 'students' },
						]}
						size='sm'
					/>
					<Group gap='sm'>
						{getEntitySelect()}
						<Select
							placeholder='Select term'
							size='sm'
							data={terms.map((term) => ({
								value: term.id.toString(),
								label: term.code,
							}))}
							value={termId ? termId.toString() : null}
							onChange={(value) => setTermId(value ? Number(value) : null)}
							clearable
							w={180}
						/>
					</Group>
				</Group>
			</Paper>
			{renderTimetable()}
		</Stack>
	);
}
