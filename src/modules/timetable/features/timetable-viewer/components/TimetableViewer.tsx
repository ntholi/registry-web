'use client';

import { Center, Select, Stack, Tabs, Text } from '@mantine/core';
import { getAllTerms } from '@registry/terms';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ClassTimetable from './ClassTimetable';
import LecturerTimetable from './LecturerTimetable';
import VenueTimetable from './VenueTimetable';

export default function TimetableViewer() {
	const [selectedTermId, setSelectedTermId] = useState<number | null>(null);

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getAllTerms(),
	});

	return (
		<Stack gap='md' p='md'>
			<Select
				label='Term'
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
				w={300}
			/>

			{!selectedTermId ? (
				<Center h={400}>
					<Text c='dimmed'>Please select a term to view timetables</Text>
				</Center>
			) : (
				<Tabs defaultValue='lecturers'>
					<Tabs.List>
						<Tabs.Tab value='lecturers'>Lecturers</Tabs.Tab>
						<Tabs.Tab value='venues'>Venues</Tabs.Tab>
						<Tabs.Tab value='students'>Students</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='lecturers' pt='lg'>
						<LecturerTimetable termId={selectedTermId} />
					</Tabs.Panel>

					<Tabs.Panel value='venues' pt='lg'>
						<VenueTimetable termId={selectedTermId} />
					</Tabs.Panel>

					<Tabs.Panel value='students' pt='lg'>
						<ClassTimetable termId={selectedTermId} />
					</Tabs.Panel>
				</Tabs>
			)}
		</Stack>
	);
}
