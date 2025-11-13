'use client';

import {
	ActionIcon,
	Button,
	Fieldset,
	Group,
	HoverCard,
	Loader,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { terms as termsTable } from '@/db/schema';
import {
	getAllSchools,
	getProgramsBySchoolId,
} from '@/server/academic/schools/actions';
import { getAllTerms } from '@/server/registry/terms/actions';
import { formatSemester } from '@/shared/lib/utils/utils';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString();
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'full'),
	};
});

export default function StudentsFilter() {
	const [opened, { toggle, close }] = useDisclosure(false);

	const [schoolId, setSchoolId] = useQueryState('schoolId');
	const [programId, setProgramId] = useQueryState('programId');
	const [termId, setTermId] = useQueryState('termId');
	const [semesterNumber, setSemesterNumber] = useQueryState('semesterNumber');

	const [filters, setFilters] = useState({
		schoolId: schoolId || '',
		programId: programId || '',
		termId: termId || '',
		semesterNumber: semesterNumber || '',
	});

	useEffect(() => {
		setFilters({
			schoolId: schoolId || '',
			programId: programId || '',
			termId: termId || '',
			semesterNumber: semesterNumber || '',
		});
	}, [schoolId, programId, termId, semesterNumber]);

	const { data: schools = [], isLoading: schoolLoading } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
		select: (data) => data.items,
		enabled: opened,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs', filters.schoolId],
		queryFn: () =>
			filters.schoolId ? getProgramsBySchoolId(Number(filters.schoolId)) : [],
		enabled: !!filters.schoolId,
	});

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	useEffect(() => {
		if (filters.schoolId !== schoolId) {
			setFilters((prev) => ({ ...prev, programId: '' }));
		}
	}, [filters.schoolId, schoolId]);

	const addSemesterDescription = useCallback(
		(
			desc: string,
			selectedSemester: string | null,
			selectedTerm: typeof termsTable.$inferSelect | undefined
		) => {
			if (selectedSemester && selectedTerm) {
				return `${desc} in ${selectedSemester}`;
			} else if (selectedSemester) {
				return `${desc} having ${selectedSemester}`;
			}
			return desc;
		},
		[]
	);

	const previewDescription = useMemo(() => {
		const selectedSchool = schools.find(
			(s) => s.id?.toString() === (filters.schoolId || '')
		);
		const selectedProgram = programs.find(
			(p) => p.id?.toString() === (filters.programId || '')
		);
		const selectedTerm = terms.find(
			(t) => t.id?.toString() === (filters.termId || '')
		);
		const selectedSemester = filters.semesterNumber
			? formatSemester(filters.semesterNumber, 'mini')
			: null;

		if (selectedProgram) {
			let desc = `${selectedProgram.code} students`;
			desc = addSemesterDescription(desc, selectedSemester, selectedTerm);

			if (selectedTerm) {
				desc += ` registered for ${selectedTerm.name}`;
			}

			return desc;
		}

		if (selectedSchool) {
			let desc = `All ${selectedSchool.code} students`;
			desc = addSemesterDescription(desc, selectedSemester, selectedTerm);

			if (selectedTerm) {
				desc += ` registered for ${selectedTerm.name}`;
			}

			return desc;
		}

		if (selectedTerm || selectedSemester) {
			let desc = 'All students';
			desc = addSemesterDescription(desc, selectedSemester, selectedTerm);

			if (selectedTerm) {
				desc += ` registered for ${selectedTerm.name}`;
			}

			return desc;
		}

		return 'All students';
	}, [
		filters.schoolId,
		filters.programId,
		filters.termId,
		filters.semesterNumber,
		schools,
		programs,
		terms,
		addSemesterDescription,
	]);

	const handleApplyFilters = () => {
		setSchoolId(filters.schoolId || null);
		setProgramId(filters.programId || null);
		setTermId(filters.termId || null);
		setSemesterNumber(filters.semesterNumber || null);
		close();
	};

	const handleClearFilters = () => {
		setFilters({
			schoolId: '',
			programId: '',
			termId: '',
			semesterNumber: '',
		});
		setSchoolId(null);
		setProgramId(null);
		setTermId(null);
		setSemesterNumber(null);
		close();
	};

	const hasActiveFilters = schoolId || programId || termId || semesterNumber;

	return (
		<>
			<HoverCard withArrow position='top'>
				<HoverCard.Target>
					<ActionIcon
						variant={hasActiveFilters ? 'white' : 'default'}
						size={33}
						onClick={toggle}
						color={hasActiveFilters ? 'blue' : undefined}
					>
						<IconFilter size={'1rem'} />
					</ActionIcon>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Text size='xs'>Filter Students</Text>
				</HoverCard.Dropdown>
			</HoverCard>

			<Modal opened={opened} onClose={close} title='Filter Students' size='md'>
				<Stack gap='md'>
					<Select
						label='School'
						placeholder='Select school'
						data={schools.map((school) => ({
							value: school.id?.toString() || '',
							label: school.name,
						}))}
						rightSection={schoolLoading && <Loader size={'xs'} />}
						value={filters.schoolId || null}
						onChange={(value) =>
							setFilters((prev) => ({
								...prev,
								schoolId: value || '',
								programId: '',
							}))
						}
						searchable
						clearable
					/>

					<Select
						label='Program'
						placeholder='Select program'
						data={programs.map((program) => ({
							value: program.id?.toString() || '',
							label: program.name,
						}))}
						rightSection={programsLoading && <Loader size={'xs'} />}
						value={filters.programId || null}
						onChange={(value) =>
							setFilters((prev) => ({
								...prev,
								programId: value || '',
							}))
						}
						searchable
						clearable
						disabled={!filters.schoolId}
					/>

					<Select
						label='Term'
						placeholder='Select term'
						data={terms.map((term) => ({
							value: term.id?.toString() || '',
							label: term.name,
						}))}
						value={filters.termId || null}
						onChange={(value) =>
							setFilters((prev) => ({
								...prev,
								termId: value || '',
							}))
						}
						searchable
						clearable
					/>

					<Select
						label='Semester'
						placeholder='Select semester'
						data={semesterOptions}
						value={filters.semesterNumber || null}
						onChange={(value) =>
							setFilters((prev) => ({
								...prev,
								semesterNumber: value || '',
							}))
						}
						searchable
						clearable
					/>

					<Fieldset legend='Description'>
						<Text size='sm'>{previewDescription}</Text>
					</Fieldset>

					<Group justify='flex-end' gap='sm'>
						<Button variant='outline' onClick={handleClearFilters}>
							Clear All
						</Button>
						<Button onClick={handleApplyFilters}>Apply Filters</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
