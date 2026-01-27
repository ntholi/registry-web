'use client';

import { getLecturers } from '@academic/lecturers';
import {
	Badge,
	Box,
	Button,
	Center,
	Group,
	Paper,
	SegmentedControl,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import TimetableGrid from '@timetable/_shared/components/TimetableGrid';
import type { UserSlot } from '@timetable/slots';
import { getAllVenues } from '@timetable/venues';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { getAllTerms } from '@/app/registry/terms';
import { getStudentClassName } from '@/shared/lib/utils/utils';
import { Pagination } from '@/shared/ui/adease/Pagination';
import { generateTimetableDocx } from '../_lib/generateTimetableDocx';
import {
	getClassesWithTimetable,
	getClassTimetableSlots,
	getLecturerTimetableSlots,
	getVenueTimetableSlots,
} from '../_server/actions';

type ViewType = 'lecturers' | 'venues' | 'students';

const ITEMS_PER_PAGE = 20;

export default function TimetableViewer() {
	const [termId, setTermId] = useQueryState('term', parseAsInteger);
	const [viewType, setViewType] = useQueryState(
		'view',
		parseAsString.withDefault('lecturers')
	);
	const [lecturerId, setLecturerId] = useQueryState('lecturer', parseAsString);
	const [venueId, setVenueId] = useQueryState('venue', parseAsString);
	const [classId, setClassId] = useQueryState('class', parseAsInteger);
	const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
	const [isDownloading, setIsDownloading] = useState(false);

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

	const selectedTerm = terms.find((t) => t.id === termId);

	async function handleDownload() {
		if (!termId || !selectedTerm) return;

		setIsDownloading(true);
		try {
			type TimetableEntry = { name: string; slots: UserSlot[] };
			let entries: TimetableEntry[] = [];
			let title = '';
			let showVenue = true;
			let showLecturer = false;
			let showClass = true;

			if (viewType === 'lecturers' && lecturerId) {
				showVenue = true;
				showLecturer = false;
				showClass = true;

				if (lecturerId === 'ALL') {
					title = 'All Lecturers Timetable';
					const lecturerMap = new Map<
						string,
						{ name: string; slots: UserSlot[] }
					>();
					for (const slot of lecturerSlots) {
						for (const sa of slot.timetableSlotAllocations) {
							const user = sa.timetableAllocation.user;
							if (user) {
								if (!lecturerMap.has(user.id)) {
									lecturerMap.set(user.id, {
										name: user.name ?? user.email ?? 'Unknown',
										slots: [],
									});
								}
								if (
									!lecturerMap
										.get(user.id)!
										.slots.some((s: UserSlot) => s.id === slot.id)
								) {
									lecturerMap.get(user.id)!.slots.push(slot);
								}
							}
						}
					}
					entries = Array.from(lecturerMap.values()).sort((a, b) =>
						a.name.localeCompare(b.name)
					);
				} else {
					const lecturer = lecturers.find((l) => l.id === lecturerId);
					title = 'Lecturer Timetable';
					entries = [
						{
							name: lecturer?.name ?? lecturer?.email ?? 'Unknown',
							slots: lecturerSlots,
						},
					];
				}
			} else if (viewType === 'venues' && venueId) {
				showVenue = false;
				showLecturer = true;
				showClass = true;

				if (venueId === 'ALL') {
					title = 'All Venues Timetable';
					const venueMap = new Map<
						string,
						{ name: string; slots: UserSlot[] }
					>();
					for (const slot of venueSlots) {
						if (slot.venue) {
							if (!venueMap.has(slot.venue.id)) {
								venueMap.set(slot.venue.id, {
									name: slot.venue.name,
									slots: [],
								});
							}
							venueMap.get(slot.venue.id)!.slots.push(slot);
						}
					}
					entries = Array.from(venueMap.values()).sort((a, b) =>
						a.name.localeCompare(b.name)
					);
				} else {
					const venue = venues.find((v) => v.id === venueId);
					title = 'Venue Timetable';
					entries = [{ name: venue?.name ?? 'Unknown', slots: venueSlots }];
				}
			} else if (viewType === 'students' && classId) {
				showVenue = true;
				showLecturer = true;
				showClass = false;

				if (classId === -1) {
					title = 'All Classes Timetable';
					const classMap = new Map<
						string,
						{ name: string; slots: UserSlot[] }
					>();
					for (const slot of classSlots) {
						for (const sa of slot.timetableSlotAllocations) {
							const sm = sa.timetableAllocation.semesterModule;
							if (sm?.semester) {
								const name = getStudentClassName({
									semesterNumber: sm.semester.semesterNumber,
									structure: {
										program: { code: sm.semester.structure.program.code },
									},
								});
								if (!classMap.has(name)) {
									classMap.set(name, { name, slots: [] });
								}
								if (
									!classMap
										.get(name)!
										.slots.some((s: UserSlot) => s.id === slot.id)
								) {
									classMap.get(name)!.slots.push(slot);
								}
							}
						}
					}
					entries = Array.from(classMap.values()).sort((a, b) =>
						a.name.localeCompare(b.name)
					);
				} else if (selectedClass) {
					title = 'Class Timetable';
					const baseClassName = getStudentClassName({
						semesterNumber: selectedClass.semesterNumber,
						structure: { program: { code: selectedClass.programCode } },
					});

					if (selectedClass.groupNames.length === 0) {
						entries = [{ name: baseClassName, slots: classSlots }];
					} else {
						entries = selectedClass.groupNames.map((groupName) => {
							const groupSlots = classSlots.filter((slot) =>
								slot.timetableSlotAllocations.some(
									(sa) =>
										sa.timetableAllocation.groupName === groupName ||
										!sa.timetableAllocation.groupName
								)
							);
							return {
								name: `${baseClassName}${groupName}`,
								slots: groupSlots,
							};
						});
					}
				}
			}

			if (entries.length === 0) return;

			const blob = await generateTimetableDocx({
				title,
				entries,
				showVenue,
				showLecturer,
				showClass,
				termCode: selectedTerm.code,
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `timetable-${viewType}-${selectedTerm.code}.docx`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} finally {
			setIsDownloading(false);
		}
	}

	function canDownload() {
		if (!termId) return false;
		switch (viewType) {
			case 'lecturers':
				return !!lecturerId && lecturerSlots.length > 0;
			case 'venues':
				return !!venueId && venueSlots.length > 0;
			case 'students':
				return !!classId && classSlots.length > 0;
			default:
				return false;
		}
	}

	function getEntitySelect() {
		switch (viewType) {
			case 'lecturers':
				return (
					<Select
						placeholder='Select lecturer'
						size='sm'
						searchable
						data={[
							{ value: 'ALL', label: 'All Lecturers' },
							...lecturers.map((lecturer) => ({
								value: lecturer.id,
								label: lecturer.name ?? lecturer.email ?? 'Unknown',
							})),
						]}
						value={lecturerId}
						onChange={(value) => {
							setLecturerId(value);
							setPage(1);
						}}
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
						data={[
							{ value: 'ALL', label: 'All Venues' },
							...venues.map((venue) => ({
								value: venue.id,
								label: venue.name,
							})),
						]}
						value={venueId}
						onChange={(value) => {
							setVenueId(value);
							setPage(1);
						}}
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
						data={[
							{ value: '-1', label: 'All Classes' },
							...classes.map((cls) => ({
								value: cls.semesterId.toString(),
								label: getStudentClassName({
									semesterNumber: cls.semesterNumber,
									structure: { program: { code: cls.programCode } },
								}),
							})),
						]}
						value={classId ? classId.toString() : null}
						onChange={(value) => {
							setClassId(value ? Number(value) : null);
							setPage(1);
						}}
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

	function renderLecturerTimetables() {
		if (lecturerId !== 'ALL') {
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
		}

		const lecturerMap = new Map<string, { name: string; slots: UserSlot[] }>();
		for (const slot of lecturerSlots) {
			for (const sa of slot.timetableSlotAllocations) {
				const user = sa.timetableAllocation.user;
				if (user) {
					if (!lecturerMap.has(user.id)) {
						lecturerMap.set(user.id, {
							name: user.name ?? user.email ?? 'Unknown',
							slots: [],
						});
					}
					if (
						!lecturerMap
							.get(user.id)!
							.slots.some((s: UserSlot) => s.id === slot.id)
					) {
						lecturerMap.get(user.id)!.slots.push(slot);
					}
				}
			}
		}

		const sortedLecturers = Array.from(lecturerMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);

		if (isLoadingLecturer) {
			return (
				<TimetableGrid
					slots={[]}
					isLoading={true}
					showVenue
					showClass
					showLecturer={false}
				/>
			);
		}

		if (sortedLecturers.length === 0) {
			return (
				<Center h={400}>
					<Text c='dimmed'>No lecturer timetables found for this term.</Text>
				</Center>
			);
		}

		const totalPages = Math.ceil(sortedLecturers.length / ITEMS_PER_PAGE);
		const paginatedLecturers = sortedLecturers.slice(
			(page - 1) * ITEMS_PER_PAGE,
			page * ITEMS_PER_PAGE
		);

		return (
			<Stack gap='xl'>
				{paginatedLecturers.map((lecturer) => (
					<Box key={lecturer.name}>
						<Badge variant='default' radius={0} p={'md'} mb={0} ml={'xl'}>
							{lecturer.name}
						</Badge>
						<TimetableGrid
							slots={lecturer.slots}
							isLoading={false}
							showVenue
							showClass
							showLecturer={false}
						/>
					</Box>
				))}
				<Pagination total={totalPages} totalItems={sortedLecturers.length} />
			</Stack>
		);
	}

	function renderVenueTimetables() {
		if (venueId !== 'ALL') {
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
		}

		const venueMap = new Map<string, { name: string; slots: UserSlot[] }>();
		for (const slot of venueSlots) {
			if (slot.venue) {
				if (!venueMap.has(slot.venue.id)) {
					venueMap.set(slot.venue.id, {
						name: slot.venue.name,
						slots: [],
					});
				}
				venueMap.get(slot.venue.id)!.slots.push(slot);
			}
		}

		const sortedVenues = Array.from(venueMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);

		if (isLoadingVenue) {
			return (
				<TimetableGrid
					slots={[]}
					isLoading={true}
					showVenue={false}
					showClass
					showLecturer
				/>
			);
		}

		if (sortedVenues.length === 0) {
			return (
				<Center h={400}>
					<Text c='dimmed'>No venue timetables found for this term.</Text>
				</Center>
			);
		}

		const totalPages = Math.ceil(sortedVenues.length / ITEMS_PER_PAGE);
		const paginatedVenues = sortedVenues.slice(
			(page - 1) * ITEMS_PER_PAGE,
			page * ITEMS_PER_PAGE
		);

		return (
			<Stack gap='xl'>
				{paginatedVenues.map((venue) => (
					<Box key={venue.name}>
						<Badge variant='default' radius={0} p={'md'} mb={0} ml={'xl'}>
							{venue.name}
						</Badge>
						<TimetableGrid
							slots={venue.slots}
							isLoading={false}
							showVenue={false}
							showClass
							showLecturer
						/>
					</Box>
				))}
				<Pagination total={totalPages} totalItems={sortedVenues.length} />
			</Stack>
		);
	}

	function renderClassTimetables() {
		if (classId === -1) {
			const classMap = new Map<string, { name: string; slots: UserSlot[] }>();
			for (const slot of classSlots) {
				for (const sa of slot.timetableSlotAllocations) {
					const sm = sa.timetableAllocation.semesterModule;
					if (sm?.semester) {
						const name = getStudentClassName({
							semesterNumber: sm.semester.semesterNumber,
							structure: {
								program: { code: sm.semester.structure.program.code },
							},
						});
						if (!classMap.has(name)) {
							classMap.set(name, {
								name,
								slots: [],
							});
						}
						if (
							!classMap.get(name)!.slots.some((s: UserSlot) => s.id === slot.id)
						) {
							classMap.get(name)!.slots.push(slot);
						}
					}
				}
			}

			const sortedClasses = Array.from(classMap.values()).sort((a, b) =>
				a.name.localeCompare(b.name)
			);

			if (isLoadingClass) {
				return (
					<TimetableGrid
						slots={[]}
						isLoading={true}
						showVenue
						showClass={false}
						showLecturer
					/>
				);
			}

			if (sortedClasses.length === 0) {
				return (
					<Center h={400}>
						<Text c='dimmed'>No class timetables found for this term.</Text>
					</Center>
				);
			}

			const totalPages = Math.ceil(sortedClasses.length / ITEMS_PER_PAGE);
			const paginatedClasses = sortedClasses.slice(
				(page - 1) * ITEMS_PER_PAGE,
				page * ITEMS_PER_PAGE
			);

			return (
				<Stack gap='xl'>
					{paginatedClasses.map((cls) => (
						<Box key={cls.name}>
							<Badge variant='default' radius={0} p={'md'} mb={0} ml={'xl'}>
								{cls.name}
							</Badge>
							<TimetableGrid
								slots={cls.slots}
								isLoading={false}
								showVenue
								showClass={false}
								showLecturer
							/>
						</Box>
					))}
					<Pagination total={totalPages} totalItems={sortedClasses.length} />
				</Stack>
			);
		}

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
				return renderLecturerTimetables();
			case 'venues':
				return renderVenueTimetables();
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
						onChange={(value) => {
							setViewType(value as ViewType);
							setPage(1);
						}}
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
						<Button
							leftSection={<IconDownload size={16} />}
							size='sm'
							variant='light'
							onClick={handleDownload}
							loading={isDownloading}
							disabled={!canDownload()}
						>
							Download
						</Button>
					</Group>
				</Group>
			</Paper>
			{renderTimetable()}
		</Stack>
	);
}
