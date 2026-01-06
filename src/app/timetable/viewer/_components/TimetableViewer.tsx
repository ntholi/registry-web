'use client';

import { getLecturers } from '@academic/lecturers';
import {
	Center,
	Group,
	Paper,
	SegmentedControl,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { getAllTerms } from '@registry/dates/terms';
import { useQuery } from '@tanstack/react-query';
import TimetableGrid from '@timetable/_shared/components/TimetableGrid';
import { getAllVenues } from '@timetable/venues';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import { selectedTermAtom } from '@/shared/ui/atoms/termAtoms';
import {
	getClassesWithTimetable,
	getClassTimetableSlots,
	getLecturerTimetableSlots,
	getVenueTimetableSlots,
} from '../_server/actions';

type ViewType = 'lecturers' | 'venues' | 'students';

export default function TimetableViewer() {
	const [selectedTermId, setSelectedTermId] = useAtom(selectedTermAtom);
	const [viewType, setViewType] = useState<ViewType>('lecturers');
	const [selectedLecturerId, setSelectedLecturerId] = useState<string | null>(
		null
	);
	const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
	const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

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
		queryKey: ['classes-for-term', selectedTermId],
		queryFn: () => getClassesWithTimetable(selectedTermId!),
		enabled: !!selectedTermId,
	});

	const lecturers = lecturersData?.items ?? [];

	const { data: lecturerSlots = [], isLoading: isLoadingLecturer } = useQuery({
		queryKey: ['lecturer-timetable', selectedLecturerId, selectedTermId],
		queryFn: () =>
			getLecturerTimetableSlots(selectedLecturerId!, selectedTermId!),
		enabled: !!selectedLecturerId && !!selectedTermId,
	});

	const { data: venueSlots = [], isLoading: isLoadingVenue } = useQuery({
		queryKey: ['venue-timetable', selectedVenueId, selectedTermId],
		queryFn: () => getVenueTimetableSlots(selectedVenueId!, selectedTermId!),
		enabled: !!selectedVenueId && !!selectedTermId,
	});

	const { data: classSlots = [], isLoading: isLoadingClass } = useQuery({
		queryKey: ['class-timetable', selectedClassId, selectedTermId],
		queryFn: () => getClassTimetableSlots(selectedClassId!, selectedTermId!),
		enabled: !!selectedClassId && !!selectedTermId,
	});

	useEffect(() => {
		if (!selectedTermId && terms.length > 0) {
			const activeTerm = terms.find((term) => term.isActive);
			if (activeTerm) {
				setSelectedTermId(activeTerm.id);
			}
		}
	}, [selectedTermId, terms, setSelectedTermId]);

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
						value={selectedLecturerId}
						onChange={setSelectedLecturerId}
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
							value: venue.id.toString(),
							label: venue.name,
						}))}
						value={selectedVenueId ? selectedVenueId.toString() : null}
						onChange={(value) =>
							setSelectedVenueId(value ? Number(value) : null)
						}
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
							label: `${cls.programCode} - ${formatSemester(cls.semesterNumber, 'short')}`,
						}))}
						value={selectedClassId ? selectedClassId.toString() : null}
						onChange={(value) =>
							setSelectedClassId(value ? Number(value) : null)
						}
						clearable
						w={220}
					/>
				);
		}
	}

	function getSelectedEntity() {
		switch (viewType) {
			case 'lecturers':
				return selectedLecturerId;
			case 'venues':
				return selectedVenueId;
			case 'students':
				return selectedClassId;
		}
	}

	function renderTimetable() {
		if (!selectedTermId) {
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
				return (
					<TimetableGrid
						slots={classSlots}
						isLoading={isLoadingClass}
						emptyMessage='No timetable found for this class.'
						showVenue
						showClass={false}
						showLecturer
					/>
				);
		}
	}

	return (
		<Stack gap='lg' p='md'>
			<Paper p='md' radius='md' withBorder>
				<Group justify='space-between' align='center'>
					<SegmentedControl
						value={viewType}
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
							value={selectedTermId ? selectedTermId.toString() : null}
							onChange={(value) => {
								if (value) {
									setSelectedTermId(Number(value));
								} else {
									setSelectedTermId(null);
								}
							}}
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
