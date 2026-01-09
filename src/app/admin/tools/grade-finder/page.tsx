'use client';

import type { Grade } from '@academic/_database';
import {
	Box,
	Container,
	Group,
	Paper,
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
import type { GradeFinderFilters } from './_server/repository';

export default function GradeFinderPage() {
	const [filters, setFilters] = useState<GradeFinderFilters | null>(null);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 400);

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
		enabled: !!filters?.grade,
	});

	function handleSearch(values: GradeFinderFilterValues) {
		if (!values.grade) return;

		setPage(1);
		setSearch('');
		setFilters({
			grade: values.grade as Grade,
			schoolId: values.schoolId ?? undefined,
			programId: values.programId ?? undefined,
			semesterNumber: values.semesterNumber ?? undefined,
			termCode: values.termCode ?? undefined,
			moduleId: values.moduleId ?? undefined,
		});
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
						<Group gap='xs' align='center'>
							<ThemeIcon size='xl' radius='sm' variant='light' color='gray'>
								<IconSearch size={24} />
							</ThemeIcon>
							<Box>
								<Title fw={400} size='h4'>
									Grade Finder
								</Title>
								<Text size='sm' c='dimmed'>
									Find students with specific grades across all active semesters
								</Text>
							</Box>
						</Group>
						<GradeFinderFilter
							onSearch={handleSearch}
							isLoading={isLoading || isFetching}
						/>
					</Stack>
				</Paper>

				{filters?.grade && (
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
