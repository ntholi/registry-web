'use client';
import {
	getActiveSchools,
	getProgramsBySchoolIds,
} from '@academic/schools/_server/actions';
import { getAllSponsors } from '@finance/sponsors/_server/actions';
import { Grid, Paper, Select, Stack, Text } from '@mantine/core';
import { getAllTerms } from '@registry/dates/terms/_server/actions';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString().padStart(2, '0');
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'mini'),
	};
});

export interface SponsoredStudentsFilter {
	termId?: number;
	schoolId?: number;
	programId?: number;
	semesterNumber?: string;
	sponsorId?: number;
}

interface Props {
	onFilterChange: (filter: SponsoredStudentsFilter) => void;
}

export default function Filter({ onFilterChange }: Props) {
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			termId: parseAsInteger,
			schoolId: parseAsInteger,
			programId: parseAsInteger,
			semesterNumber: parseAsString,
			sponsorId: parseAsInteger,
		},
		{
			history: 'push',
		}
	);

	useEffect(() => {
		const newFilter: SponsoredStudentsFilter = {
			termId: localFilter.termId ?? undefined,
			schoolId: localFilter.schoolId ?? undefined,
			programId: localFilter.programId ?? undefined,
			semesterNumber: localFilter.semesterNumber ?? undefined,
			sponsorId: localFilter.sponsorId ?? undefined,
		};
		onFilterChange(newFilter);
	}, [localFilter, onFilterChange]);

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['active-schools'],
		queryFn: getActiveSchools,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school', localFilter.schoolId],
		queryFn: () =>
			getProgramsBySchoolIds(
				localFilter.schoolId ? [localFilter.schoolId] : undefined
			),
		enabled: Boolean(localFilter.schoolId),
	});

	const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery({
		queryKey: ['sponsors'],
		queryFn: getAllSponsors,
	});

	function handleChange(field: string, value: string | number | null) {
		const updates: Record<string, number | string | null> = {
			[field]: value,
		};

		if (field === 'schoolId') {
			updates.programId = null;
		}

		setLocalFilter(updates);
	}

	return (
		<Paper withBorder p='md'>
			<Stack gap='md'>
				<Grid>
					<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
						<Select
							label='Term'
							placeholder='Select term'
							data={terms.map((term) => ({
								value: term.id.toString(),
								label: term.code,
							}))}
							value={localFilter.termId?.toString() ?? null}
							onChange={(value) =>
								handleChange('termId', value ? Number(value) : null)
							}
							searchable
							clearable
							disabled={termsLoading}
							required
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
						<Select
							label='School'
							placeholder='All schools'
							data={schools.map((school) => ({
								value: school.id.toString(),
								label: school.code,
								description: school.name,
							}))}
							value={localFilter.schoolId?.toString() ?? null}
							onChange={(value) =>
								handleChange('schoolId', value ? Number(value) : null)
							}
							searchable
							clearable
							disabled={schoolsLoading}
							renderOption={({ option }) => {
								const customOption = option as {
									value: string;
									label: string;
									description: string;
								};
								return (
									<div>
										<Text>{customOption.label}</Text>
										<Text size='xs' c='dimmed'>
											{customOption.description}
										</Text>
									</div>
								);
							}}
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
						<Select
							label='Program'
							placeholder='All programs'
							data={programs.map((program) => ({
								value: program.id.toString(),
								label: program.name,
							}))}
							value={localFilter.programId?.toString() ?? null}
							onChange={(value) =>
								handleChange('programId', value ? Number(value) : null)
							}
							searchable
							clearable
							disabled={programsLoading || !localFilter.schoolId}
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
						<Select
							label='Semester'
							placeholder='All semesters'
							data={semesterOptions}
							value={localFilter.semesterNumber ?? null}
							onChange={(value) => handleChange('semesterNumber', value)}
							clearable
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
						<Select
							label='Sponsor'
							placeholder='All sponsors'
							data={sponsors.map((sponsor) => ({
								value: sponsor.id.toString(),
								label: sponsor.name,
							}))}
							value={localFilter.sponsorId?.toString() ?? null}
							onChange={(value) =>
								handleChange('sponsorId', value ? Number(value) : null)
							}
							searchable
							clearable
							disabled={sponsorsLoading}
						/>
					</Grid.Col>
				</Grid>
			</Stack>
		</Paper>
	);
}
