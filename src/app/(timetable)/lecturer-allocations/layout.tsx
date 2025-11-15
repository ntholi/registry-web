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
	Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { getAllTerms } from '@registry/terms';
import { useQuery } from '@tanstack/react-query';
import { getLecturersByTerm } from '@timetable/lecturer-allocations';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import { ListItem, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [view, setView] = useViewSelect();

	const { data: terms = [] } = useQuery({
		queryKey: ['terms', 'all'],
		queryFn: getAllTerms,
	});

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
					<Flex direction='column' h='100%'>
						<Stack p='md' gap='sm'>
							<Select
								label='Term'
								placeholder='Select a term to view allocations'
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
							{!selectedTermId && (
								<Text size='sm' c='dimmed'>
									Please select a term to view lecturer allocations
								</Text>
							)}
						</Stack>

						<Divider />

						<ScrollArea type='always' style={{ flex: 1 }} p='md'>
							{isLoading ? (
								<Stack gap='sm'>
									{Array.from({ length: 5 }).map(() => (
										<Skeleton height={35} key={crypto.randomUUID()} />
									))}
								</Stack>
							) : (
								<Stack gap={3}>
									{lecturers.map((lecturer) => (
										<ListItem
											key={lecturer.userId}
											id={lecturer.userId}
											label={lecturer.user?.name || 'Unknown Lecturer'}
											description={lecturer.user?.email || ''}
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
					</Flex>
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
