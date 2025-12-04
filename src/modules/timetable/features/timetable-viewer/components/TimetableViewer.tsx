'use client';

import { Center, Group, Select, Stack, Tabs, Text } from '@mantine/core';
import { getAllTerms } from '@registry/terms';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { selectedTermAtom } from '@/shared/ui/atoms/termAtoms';
import ClassTimetable from './ClassTimetable';
import LecturerTimetable from './LecturerTimetable';
import VenueTimetable from './VenueTimetable';

export default function TimetableViewer() {
	const [selectedTermId, setSelectedTermId] = useAtom(selectedTermAtom);

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getAllTerms(),
	});

	useEffect(() => {
		if (!selectedTermId && terms.length > 0) {
			const activeTerm = terms.find((term) => term.isActive);
			if (activeTerm) {
				setSelectedTermId(activeTerm.id);
			}
		}
	}, [selectedTermId, terms, setSelectedTermId]);

	return (
		<Stack gap='md' p='md'>
			<Tabs defaultValue='lecturers'>
				<Tabs.List>
					<Tabs.Tab value='lecturers'>Lecturers</Tabs.Tab>
					<Tabs.Tab value='venues'>Venues</Tabs.Tab>
					<Tabs.Tab value='students'>Students</Tabs.Tab>
					<Group ml='auto' mb={'xs'}>
						<Text>Term:</Text>
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
						/>
					</Group>
				</Tabs.List>

				{!selectedTermId ? (
					<Center h={400}>
						<Text c='dimmed'>Please select a term to view timetables</Text>
					</Center>
				) : (
					<>
						<Tabs.Panel value='lecturers' pt='lg'>
							<LecturerTimetable termId={selectedTermId} />
						</Tabs.Panel>

						<Tabs.Panel value='venues' pt='lg'>
							<VenueTimetable termId={selectedTermId} />
						</Tabs.Panel>

						<Tabs.Panel value='students' pt='lg'>
							<ClassTimetable termId={selectedTermId} />
						</Tabs.Panel>
					</>
				)}
			</Tabs>
		</Stack>
	);
}
