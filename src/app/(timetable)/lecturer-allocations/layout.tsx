'use client';

import {
	Divider,
	Flex,
	Grid,
	GridCol,
	Paper,
	ScrollArea,
	Select,
	Skeleton,
	Stack,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { getAllTerms } from '@registry/terms';
import { useQuery } from '@tanstack/react-query';
import { getLecturersByTerm } from '@timetable/lecturer-allocations';
import { useAtom } from 'jotai';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import { ListItem, NewLink, SearchField } from '@/shared/ui/adease';
import { selectedTermAtom } from '@/shared/ui/atoms/termAtoms';

export default function Layout({ children }: PropsWithChildren) {
	const [selectedTermId, setSelectedTermId] = useAtom(selectedTermAtom);
	const [search, setSearch] = useState('');
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [view, setView] = useViewSelect();

	const { data: terms = [] } = useQuery({
		queryKey: ['terms', 'all'],
		queryFn: getAllTerms,
	});

	useEffect(() => {
		setSearch('');
	}, []);

	const { isLoading, data: lecturers = [] } = useQuery({
		queryKey: ['lecturer-allocations', selectedTermId?.toString() ?? 'all'],
		queryFn: async () => {
			if (!selectedTermId) {
				return [];
			}
			return getLecturersByTerm(selectedTermId);
		},
		staleTime: 0,
	});

	const filteredLecturers = lecturers.filter((lecturer) => {
		if (!search) return true;
		const searchLower = search.toLowerCase();
		const name = lecturer.user?.name?.toLowerCase() || '';
		const email = lecturer.user?.email?.toLowerCase() || '';
		return name.includes(searchLower) || email.includes(searchLower);
	});

	if (isMobile && view === 'details') {
		return (
			<Paper withBorder>
				<ScrollArea h='88vh' type='always'>
					{children}
				</ScrollArea>
			</Paper>
		);
	}

	return (
		<Grid columns={14} gutter='md'>
			<GridCol span={isMobile ? 14 : 4} pb={0}>
				<Paper withBorder h='88vh'>
					<Stack h='100%'>
						<Stack p='md' pb={0} gap={'md'}>
							<Flex gap='sm'>
								<Select
									flex={1}
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
									searchable
									clearable
								/>
								<Flex justify='flex-end'>
									<NewLink
										href={
											selectedTermId
												? `/lecturer-allocations/new?termId=${selectedTermId}`
												: '/lecturer-allocations/new'
										}
									/>
								</Flex>
							</Flex>
							<SearchField
								value={search}
								onChange={(e) => setSearch(e.currentTarget.value)}
								disabled={!selectedTermId}
								placeholder={
									selectedTermId ? 'Search lecturers...' : 'Select a term first'
								}
							/>
						</Stack>

						<Divider />

						<ScrollArea type='always' style={{ flex: 1 }} p='md' pt={5}>
							{isLoading ? (
								<Stack gap='sm'>
									{Array.from({ length: 5 }).map(() => (
										<Skeleton height={35} key={crypto.randomUUID()} />
									))}
								</Stack>
							) : (
								<Stack gap={3}>
									{filteredLecturers.map((lecturer) => (
										<ListItem
											key={lecturer.userId}
											id={lecturer.userId}
											label={lecturer.user?.name || 'Unknown Lecturer'}
											path='/lecturer-allocations'
											onClick={async () => {
												if (isMobile) {
													await setView('details');
												}
												router.push(`/lecturer-allocations/${lecturer.userId}`);
											}}
										/>
									))}
								</Stack>
							)}
						</ScrollArea>
					</Stack>
				</Paper>
			</GridCol>

			{!isMobile && (
				<GridCol span={10} pb={0} pr={5}>
					<Paper withBorder>
						<ScrollArea h='88vh' type='always'>
							{children}
						</ScrollArea>
					</Paper>
				</GridCol>
			)}
		</Grid>
	);
}
