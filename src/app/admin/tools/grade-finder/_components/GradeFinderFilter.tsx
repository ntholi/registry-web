'use client';

import type { Grade } from '@academic/_database';
import { grade as gradeEnum } from '@academic/_database/schema/enums';
import {
	getActiveSchools,
	getProgramsBySchoolId,
} from '@academic/schools/_server/actions';
import {
	Autocomplete,
	Button,
	Group,
	Loader,
	Paper,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { getAllTerms } from '@registry/dates/terms/_server/actions';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import { searchModulesForGradeFinder } from '../_server/actions';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const num = (i + 1).toString();
	return {
		value: num,
		label: formatSemester(num, 'short'),
	};
});

export interface GradeFinderFilterValues {
	grade: Grade | null;
	schoolId: number | null;
	programId: number | null;
	semesterNumber: string | null;
	termCode: string | null;
	moduleId: number | null;
}

interface Props {
	onSearch: (filters: GradeFinderFilterValues) => void;
	isLoading?: boolean;
}

export function GradeFinderFilter({ onSearch, isLoading }: Props) {
	const [grade, setGrade] = useState<Grade | null>(null);
	const [schoolId, setSchoolId] = useState<number | null>(null);
	const [programId, setProgramId] = useState<number | null>(null);
	const [semesterNumber, setSemesterNumber] = useState<string | null>(null);
	const [termCode, setTermCode] = useState<string | null>(null);
	const [moduleId, setModuleId] = useState<number | null>(null);
	const [moduleSearch, setModuleSearch] = useState('');
	const [debouncedModuleSearch] = useDebouncedValue(moduleSearch, 300);

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['active-schools'],
		queryFn: getActiveSchools,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school', schoolId],
		queryFn: () => getProgramsBySchoolId(schoolId ?? undefined),
		enabled: !!schoolId,
	});

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	const { data: moduleOptions = [], isLoading: modulesLoading } = useQuery({
		queryKey: ['grade-finder-modules', debouncedModuleSearch],
		queryFn: () => searchModulesForGradeFinder(debouncedModuleSearch),
		enabled: debouncedModuleSearch.length >= 2,
	});

	const gradeOptions = gradeEnum.enumValues.map((g) => ({
		value: g,
		label: g,
	}));

	const schoolOptions = schools.map((s) => ({
		value: s.id.toString(),
		label: `${s.code} - ${s.name}`,
	}));

	const programOptions = programs.map((p) => ({
		value: p.id.toString(),
		label: `${p.code} - ${p.name}`,
	}));

	const termOptions = terms.map((t) => ({
		value: t.code,
		label: t.code,
	}));

	const moduleAutocompleteOptions = moduleOptions.map((m) => ({
		value: m.id.toString(),
		label: `${m.code} - ${m.name}`,
	}));

	function handleSearch() {
		onSearch({
			grade,
			schoolId,
			programId,
			semesterNumber,
			termCode,
			moduleId,
		});
	}

	function handleReset() {
		setGrade(null);
		setSchoolId(null);
		setProgramId(null);
		setSemesterNumber(null);
		setTermCode(null);
		setModuleId(null);
		setModuleSearch('');
	}

	function handleSchoolChange(value: string | null) {
		setSchoolId(value ? Number(value) : null);
		setProgramId(null);
	}

	function handleModuleSelect(value: string) {
		const selected = moduleOptions.find((m) => m.id.toString() === value);
		if (selected) {
			setModuleId(selected.id);
			setModuleSearch(`${selected.code} - ${selected.name}`);
		}
	}

	return (
		<Paper withBorder p='md'>
			<Stack gap='md'>
				<Text fw={500} size='sm'>
					Search Filters
				</Text>

				<Group grow align='flex-end'>
					<Select
						label='Grade'
						placeholder='Select grade'
						data={gradeOptions}
						value={grade}
						onChange={(value) => setGrade(value as Grade | null)}
						searchable
						clearable
						required
					/>

					<Select
						label='School'
						placeholder='All schools'
						data={schoolOptions}
						value={schoolId?.toString() ?? null}
						onChange={handleSchoolChange}
						searchable
						clearable
						rightSection={schoolsLoading ? <Loader size='xs' /> : null}
					/>

					<Select
						label='Program'
						placeholder='All programs'
						data={programOptions}
						value={programId?.toString() ?? null}
						onChange={(value) => setProgramId(value ? Number(value) : null)}
						searchable
						clearable
						disabled={!schoolId}
						rightSection={programsLoading ? <Loader size='xs' /> : null}
					/>
				</Group>

				<Group grow align='flex-end'>
					<Select
						label='Semester'
						placeholder='All semesters'
						data={semesterOptions}
						value={semesterNumber}
						onChange={setSemesterNumber}
						clearable
					/>

					<Select
						label='Term'
						placeholder='All terms'
						data={termOptions}
						value={termCode}
						onChange={setTermCode}
						searchable
						clearable
						rightSection={termsLoading ? <Loader size='xs' /> : null}
					/>

					<Autocomplete
						label='Module'
						placeholder='Search by code or name'
						value={moduleSearch}
						onChange={(value) => {
							setModuleSearch(value);
							if (!value) setModuleId(null);
						}}
						onOptionSubmit={handleModuleSelect}
						data={moduleAutocompleteOptions}
						rightSection={modulesLoading ? <Loader size='xs' /> : null}
					/>
				</Group>

				<Group justify='flex-end'>
					<Button variant='subtle' onClick={handleReset}>
						Reset
					</Button>
					<Button
						leftSection={<IconSearch size={16} />}
						onClick={handleSearch}
						loading={isLoading}
						disabled={!grade}
					>
						Search
					</Button>
				</Group>
			</Stack>
		</Paper>
	);
}
