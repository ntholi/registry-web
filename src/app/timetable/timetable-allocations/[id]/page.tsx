'use client';

import { getLecturer } from '@academic/lecturers';
import {
	Center,
	Divider,
	Flex,
	Select,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { notFound } from 'next/navigation';
import { use, useEffect, useMemo } from 'react';
import { getAllTerms } from '@/app/registry/terms';
import useConfigDefaults from '@/shared/lib/hooks/use-config-defaults';
import { DetailsView } from '@/shared/ui/adease';
import { selectedTermAtom } from '@/shared/ui/atoms/termAtoms';
import AllocationTab from '../_components/AllocationTab';
import TimetableTab from '../_components/TimetableTab';
import { getTimetableAllocationsByUserId } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default function LecturerAllocationDetails({ params }: Props) {
	const { id } = use(params);
	const [selectedTermId, setSelectedTermId] = useAtom(selectedTermAtom);

	const { data: lecturer, isLoading: lecturerLoading } = useQuery({
		queryKey: ['lecturer', id],
		queryFn: () => getLecturer(id),
	});

	const { data: allocations = [], isLoading: allocationsLoading } = useQuery({
		queryKey: ['timetable-allocations', id],
		queryFn: () => getTimetableAllocationsByUserId(id),
	});

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: async () => getAllTerms(),
	});

	const { defaults } = useConfigDefaults();

	useEffect(() => {
		if (!selectedTermId && terms.length > 0) {
			const activeTerm = terms.find((term) => term.isActive);
			if (activeTerm) {
				setSelectedTermId(activeTerm.id);
			}
		}
	}, [selectedTermId, terms, setSelectedTermId]);

	const filteredAllocations = useMemo(() => {
		if (!selectedTermId) return [];
		return allocations.filter(
			(allocation) => allocation.termId === selectedTermId
		);
	}, [allocations, selectedTermId]);

	const totalMinutes = useMemo(() => {
		return filteredAllocations.reduce(
			(sum, allocation) => sum + (allocation.duration || 0),
			0
		);
	}, [filteredAllocations]);

	const totalStudents = useMemo(() => {
		return filteredAllocations.reduce(
			(sum, allocation) => sum + (allocation.numberOfStudents ?? 0),
			0
		);
	}, [filteredAllocations]);

	if (lecturerLoading || allocationsLoading) {
		return null;
	}

	if (!lecturer) {
		return notFound();
	}

	return (
		<DetailsView>
			<Flex justify='space-between' align='center' gap='md' wrap='wrap'>
				<Title order={3} fw={100}>
					{lecturer.name}
				</Title>
				<Select
					placeholder='Select a term'
					data={terms.map((term) => ({
						value: term.id.toString(),
						label: term.code + (term.isActive ? ' (Current)' : ''),
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
			</Flex>
			<Divider my={15} />
			{!selectedTermId ? (
				<Center h={400}>
					<Stack align='center' gap='md'>
						<Text>Please select a term to view allocations</Text>
					</Stack>
				</Center>
			) : (
				<Tabs defaultValue='allocations'>
					<Tabs.List>
						<Tabs.Tab value='allocations'>Allocations</Tabs.Tab>
						<Tabs.Tab value='timetable'>Timetable</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='allocations' pt='lg'>
						<AllocationTab
							filteredAllocations={filteredAllocations}
							userId={id}
							selectedTermId={selectedTermId}
							termCode={terms.find((term) => term.id === selectedTermId)?.code}
							totalMinutes={totalMinutes}
							totalStudents={totalStudents}
							defaults={defaults}
						/>
					</Tabs.Panel>

					<Tabs.Panel value='timetable' pt='lg'>
						<TimetableTab userId={id} selectedTermId={selectedTermId} />
					</Tabs.Panel>
				</Tabs>
			)}
		</DetailsView>
	);
}
