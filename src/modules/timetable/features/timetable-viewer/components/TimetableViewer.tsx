'use client';

import {
	Box,
	Center,
	Select,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import { getAllTerms } from '@registry/terms';
import { IconBuilding, IconSchool, IconUsers } from '@tabler/icons-react';
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
			<Tabs defaultValue='lecturers' variant='outline'>
				<TabsList>
					<TabsTab value='lecturers' leftSection={<IconUsers size={16} />}>
						Lecturers
					</TabsTab>
					<TabsTab value='venues' leftSection={<IconBuilding size={16} />}>
						Venues
					</TabsTab>
					<TabsTab value='students' leftSection={<IconSchool size={16} />}>
						Students
					</TabsTab>
					<Box ml='auto' mb={10}>
						<Select
							placeholder='Select term'
							size='sm'
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
					</Box>
				</TabsList>

				{!selectedTermId ? (
					<Center h={400}>
						<Text c='dimmed'>Please select a term to view timetables</Text>
					</Center>
				) : (
					<>
						<TabsPanel value='lecturers' pt='lg'>
							<LecturerTimetable termId={selectedTermId} />
						</TabsPanel>

						<TabsPanel value='venues' pt='lg'>
							<VenueTimetable termId={selectedTermId} />
						</TabsPanel>

						<TabsPanel value='students' pt='lg'>
							<ClassTimetable termId={selectedTermId} />
						</TabsPanel>
					</>
				)}
			</Tabs>
		</Stack>
	);
}
