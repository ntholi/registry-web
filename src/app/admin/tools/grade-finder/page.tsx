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
import { IconChartBar, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
	CGPAFinderFilter,
	type CGPAFinderFilterValues,
} from './_components/CGPAFinderFilter';
import { CGPAFinderResultsTable } from './_components/CGPAFinderResultsTable';
import {
	GradeFinderFilter,
	type GradeFinderFilterValues,
} from './_components/GradeFinderFilter';
import { GradeFinderResultsTable } from './_components/GradeFinderResultsTable';
import { findStudentsByCGPA, findStudentsByGrade } from './_server/actions';
import type { CGPAFinderFilters } from './_server/cgpa-repository';
import type { GradeFinderFilters, SearchMode } from './_server/repository';

export default function GradeFinderPage() {
	const [mode, setMode] = useState<SearchMode>('grade');
	const [gradeFilters, setGradeFilters] = useState<GradeFinderFilters | null>(
		null
	);
	const [cgpaFilters, setCgpaFilters] = useState<CGPAFinderFilters | null>(
		null
	);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 400);

	const canFetchGrade =
		gradeFilters?.mode === 'grade'
			? !!gradeFilters.grade
			: gradeFilters?.mode === 'points' &&
				gradeFilters.minPoints !== undefined &&
				gradeFilters.maxPoints !== undefined;

	const canFetchCGPA =
		cgpaFilters !== null &&
		cgpaFilters.minCGPA !== undefined &&
		cgpaFilters.maxCGPA !== undefined;

	const gradeQuery = useQuery({
		queryKey: ['grade-finder', gradeFilters, page, debouncedSearch],
		queryFn: () =>
			findStudentsByGrade(
				{
					...gradeFilters!,
					search: debouncedSearch || undefined,
				},
				page
			),
		enabled: mode === 'grade' && !!gradeFilters && canFetchGrade,
	});

	const cgpaQuery = useQuery({
		queryKey: ['cgpa-finder', cgpaFilters, page, debouncedSearch],
		queryFn: () =>
			findStudentsByCGPA(
				{
					...cgpaFilters!,
					search: debouncedSearch || undefined,
				},
				page
			),
		enabled: mode === 'points' && canFetchCGPA,
	});

	function handleGradeSearch(values: GradeFinderFilterValues) {
		if (values.mode === 'grade' && !values.grade) return;
		if (
			values.mode === 'points' &&
			(values.minPoints === null || values.maxPoints === null)
		)
			return;

		setPage(1);
		setSearch('');
		setGradeFilters({
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

	function handleCGPASearch(values: CGPAFinderFilterValues) {
		if (values.minCGPA === null || values.maxCGPA === null) return;

		setPage(1);
		setSearch('');
		setCgpaFilters({
			minCGPA: values.minCGPA,
			maxCGPA: values.maxCGPA,
			schoolId: values.schoolId ?? undefined,
			programId: values.programId ?? undefined,
			termCode: values.termCode ?? undefined,
		});
	}

	function handleModeChange(value: string) {
		setMode(value as SearchMode);
		setPage(1);
		setSearch('');
	}

	function handlePageChange(newPage: number) {
		setPage(newPage);
	}

	function handleSearchChange(value: string) {
		setSearch(value);
		setPage(1);
	}

	const isGradeMode = mode === 'grade';
	const isCGPAMode = mode === 'points';

	return (
		<Container size='xl' py='lg' px='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='md' p='lg'>
					<Stack gap='md'>
						<Group gap='xs' align='center' justify='space-between'>
							<Group gap='xs' align='center'>
								<ThemeIcon
									size='xl'
									radius='sm'
									variant='light'
									color={isGradeMode ? 'gray' : 'blue'}
								>
									{isGradeMode ? (
										<IconSearch size={24} />
									) : (
										<IconChartBar size={24} />
									)}
								</ThemeIcon>
								<Box>
									<Title fw={400} size='h4'>
										{isGradeMode ? 'Grade Finder' : 'Points (CGPA) Finder'}
									</Title>
									<Text size='sm' c='dimmed'>
										{isGradeMode
											? 'Find students with specific grades across all active semesters'
											: 'Find students by their cumulative GPA calculated from academic history'}
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

						{isGradeMode ? (
							<GradeFinderFilter
								mode='grade'
								onSearch={handleGradeSearch}
								isLoading={gradeQuery.isLoading || gradeQuery.isFetching}
							/>
						) : (
							<CGPAFinderFilter
								onSearch={handleCGPASearch}
								isLoading={cgpaQuery.isLoading || cgpaQuery.isFetching}
							/>
						)}
					</Stack>
				</Paper>

				{isGradeMode && gradeFilters && canFetchGrade && (
					<GradeFinderResultsTable
						data={gradeQuery.data?.items ?? []}
						isLoading={gradeQuery.isLoading || gradeQuery.isFetching}
						total={gradeQuery.data?.total ?? 0}
						pages={gradeQuery.data?.pages ?? 0}
						currentPage={page}
						onPageChange={handlePageChange}
						onSearchChange={handleSearchChange}
					/>
				)}

				{isCGPAMode && canFetchCGPA && (
					<CGPAFinderResultsTable
						data={cgpaQuery.data?.items ?? []}
						isLoading={cgpaQuery.isLoading || cgpaQuery.isFetching}
						total={cgpaQuery.data?.total ?? 0}
						pages={cgpaQuery.data?.pages ?? 0}
						currentPage={page}
						onPageChange={handlePageChange}
						onSearchChange={handleSearchChange}
					/>
				)}
			</Stack>
		</Container>
	);
}
