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
import { IconChartBar, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
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
import {
	exportCGPAFinderResults,
	exportGradeFinderResults,
	findStudentsByCGPA,
	findStudentsByGrade,
} from './_server/actions';
import type { CGPAFinderFilters } from './_server/cgpa-repository';
import type { GradeFinderFilters, SearchMode } from './_server/repository';

export default function GradeFinderPage() {
	const [params, setParams] = useQueryStates({
		mode: parseAsString.withDefault('grade'),
		page: parseAsInteger.withDefault(1),
		search: parseAsString.withDefault(''),
		grade: parseAsString,
		minPoints: parseAsInteger,
		maxPoints: parseAsInteger,
		minCGPA: parseAsString,
		maxCGPA: parseAsString,
		schoolIds: parseAsArrayOf(parseAsInteger),
		programId: parseAsInteger,
		semesterNumber: parseAsString,
		termCode: parseAsString,
		moduleId: parseAsInteger,
	});

	const mode = params.mode as SearchMode;
	const isGradeMode = mode === 'grade';
	const isCGPAMode = mode === 'points';

	const gradeFilters: GradeFinderFilters | null =
		isGradeMode && params.grade
			? {
					mode: 'grade',
					grade: params.grade as Grade,
					schoolIds:
						params.schoolIds && params.schoolIds.length > 0
							? params.schoolIds
							: undefined,
					programId: params.programId ?? undefined,
					semesterNumber: params.semesterNumber ?? undefined,
					termCode: params.termCode ?? undefined,
					moduleId: params.moduleId ?? undefined,
					search: params.search || undefined,
				}
			: null;

	const cgpaFilters: CGPAFinderFilters | null =
		isCGPAMode && params.minCGPA && params.maxCGPA
			? {
					minCGPA: Number.parseFloat(params.minCGPA),
					maxCGPA: Number.parseFloat(params.maxCGPA),
					schoolIds:
						params.schoolIds && params.schoolIds.length > 0
							? params.schoolIds
							: undefined,
					programId: params.programId ?? undefined,
					termCode: params.termCode ?? undefined,
					search: params.search || undefined,
				}
			: null;

	const canFetchGrade = isGradeMode && gradeFilters !== null;
	const canFetchCGPA = isCGPAMode && cgpaFilters !== null;

	const gradeQuery = useQuery({
		queryKey: ['grade-finder', gradeFilters, params.page],
		queryFn: () => findStudentsByGrade(gradeFilters!, params.page),
		enabled: canFetchGrade,
	});

	const cgpaQuery = useQuery({
		queryKey: ['cgpa-finder', cgpaFilters, params.page],
		queryFn: () => findStudentsByCGPA(cgpaFilters!, params.page),
		enabled: canFetchCGPA,
	});

	function handleGradeSearch(values: GradeFinderFilterValues) {
		if (values.mode === 'grade' && !values.grade) return;

		setParams({
			page: 1,
			search: '',
			grade: values.grade ?? null,
			minPoints: values.minPoints,
			maxPoints: values.maxPoints,
			schoolIds: values.schoolIds,
			programId: values.programId,
			semesterNumber: values.semesterNumber,
			termCode: values.termCode,
			moduleId: values.moduleId,
		});
	}

	function handleCGPASearch(values: CGPAFinderFilterValues) {
		if (values.minCGPA === null || values.maxCGPA === null) return;

		setParams({
			page: 1,
			search: '',
			minCGPA: values.minCGPA.toString(),
			maxCGPA: values.maxCGPA.toString(),
			schoolIds: values.schoolIds,
			programId: values.programId,
			termCode: values.termCode,
		});
	}

	function handleModeChange(value: string) {
		setParams({
			mode: value,
			page: 1,
			search: '',
			grade: null,
			minPoints: null,
			maxPoints: null,
			minCGPA: null,
			maxCGPA: null,
			schoolIds: null,
			programId: null,
			semesterNumber: null,
			termCode: null,
			moduleId: null,
		});
	}

	function handlePageChange(newPage: number) {
		setParams({ page: newPage });
	}

	function handleSearchChange(value: string) {
		setParams({ search: value, page: 1 });
	}

	async function handleGradeExport() {
		if (!gradeFilters) return [];
		return exportGradeFinderResults(gradeFilters);
	}

	async function handleCGPAExport() {
		if (!cgpaFilters) return [];
		return exportCGPAFinderResults(cgpaFilters);
	}

	return (
		<Container size='xl' py='lg' px='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='md' p='lg'>
					<Stack gap='md'>
						<Group gap='xs' align='center' justify='space-between'>
							<Group gap='xs' align='center'>
								<ThemeIcon size='xl' radius='sm' variant='light' color={'gray'}>
									{isGradeMode ? (
										<IconSearch size={24} />
									) : (
										<IconChartBar size={24} />
									)}
								</ThemeIcon>
								<Box>
									<Title fw={400} size='h4'>
										{isGradeMode ? 'Grade Finder' : 'CGPA Finder'}
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
									{ label: 'CGPA', value: 'points' },
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

				{isGradeMode && canFetchGrade && (
					<GradeFinderResultsTable
						data={gradeQuery.data?.items ?? []}
						isLoading={gradeQuery.isLoading || gradeQuery.isFetching}
						total={gradeQuery.data?.total ?? 0}
						pages={gradeQuery.data?.pages ?? 0}
						currentPage={params.page}
						onPageChange={handlePageChange}
						onSearchChange={handleSearchChange}
						onExport={handleGradeExport}
					/>
				)}

				{isCGPAMode && canFetchCGPA && (
					<CGPAFinderResultsTable
						data={cgpaQuery.data?.items ?? []}
						isLoading={cgpaQuery.isLoading || cgpaQuery.isFetching}
						total={cgpaQuery.data?.total ?? 0}
						pages={cgpaQuery.data?.pages ?? 0}
						currentPage={params.page}
						onPageChange={handlePageChange}
						onSearchChange={handleSearchChange}
						onExport={handleCGPAExport}
					/>
				)}
			</Stack>
		</Container>
	);
}
