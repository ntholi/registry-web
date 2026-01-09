'use client';

import type { Grade } from '@academic/_database';
import {
	Box,
	Container,
	Group,
	Paper,
	SegmentedControl,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
	GradeFinderFilter,
	type GradeFinderFilterValues,
} from './_components/GradeFinderFilter';
import { GradeFinderResultsTable } from './_components/GradeFinderResultsTable';
import { findStudentsByGrade } from './_server/actions';
import type { GradeFinderFilters, SearchMode } from './_server/repository';

export default function GradeFinderPage() {
	const [mode, setMode] = useState<SearchMode>('grade');
	const [filters, setFilters] = useState<GradeFinderFilters | null>(null);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 400);

	const canFetch =
		filters?.mode === 'grade'
			? !!filters.grade
			: filters?.mode === 'points' &&
				filters.minPoints !== undefined &&
				filters.maxPoints !== undefined;

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ['grade-finder', filters, page, debouncedSearch],
		queryFn: () =>
			findStudentsByGrade(
				{
					...filters!,
					search: debouncedSearch || undefined,
				},
				page
			),
		enabled: !!filters && canFetch,
	});

	function handleSearch(values: GradeFinderFilterValues) {
		if (values.mode === 'grade' && !values.grade) return;
		if (
			values.mode === 'points' &&
			(values.minPoints === null || values.maxPoints === null)
		)
			return;

		setPage(1);
		setSearch('');
		setFilters({
			mode: values.mode,
			grade: values.grade as Grade | undefined,
			minPoints: values.minPoints ?? undefined,
			maxPoints: values.maxPoints ?? undefined,
			schoolId: values.schoolId ?? undefined,
			programId: values.programId ?? undefined,
			semesterNumber: values.semesterNumber ?? undefined,
			termCode: values.termCode ?? undefined,
			moduleId: values.moduleId ?? undefined,
		});
	}

	function handleModeChange(value: string) {
		setMode(value as SearchMode);
		setFilters(null);
	}

	function handlePageChange(newPage: number) {
		setPage(newPage);
	}

	function handleSearchChange(value: string) {
		setSearch(value);
		setPage(1);
	}

	return (
		<Container size='xl' py='lg' px='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='md' p='lg'>
					<Stack gap='md'>
						<Group gap='xs' align='center' justify='space-between'>
							<Group gap='xs' align='center'>
								<ThemeIcon size='xl' radius='sm' variant='light' color='gray'>
									<IconSearch size={24} />
								</ThemeIcon>
								<Box>
									<Title fw={400} size='h4'>
										Grade Finder
									</Title>
									<Text size='sm' c='dimmed'>
										Find students with specific grades or CGPA (points) across
										all active semesters
									</Text>
								</Box>
							</Group>
							<SegmentedControl
								value={mode}
								onChange={handleModeChange}
								data={[
									{ label: 'Grade', value: 'grade' },
									{ label: 'Points', value: 'points' },
								]}
							/>
						</Group>
						<GradeFinderFilter
							mode={mode}
							onSearch={handleSearch}
							isLoading={isLoading || isFetching}
						/>
					</Stack>
				</Paper>

				{filters && canFetch && (
					<GradeFinderResultsTable
						data={data?.items ?? []}
						isLoading={isLoading || isFetching}
						total={data?.total ?? 0}
						pages={data?.pages ?? 0}
						currentPage={page}
						onPageChange={handlePageChange}
						onSearchChange={handleSearchChange}
					/>
				)}
			</Stack>
		</Container>
	);
}
