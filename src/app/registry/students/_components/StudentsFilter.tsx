'use client';

import { getAllSchools, getProgramsBySchoolId } from '@academic/schools';
import { ActionIcon, Loader, Select, Tooltip } from '@mantine/core';
import { IconFocus2 } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import { getTermByCode } from '@/app/registry/terms';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { useAllTerms } from '@/shared/lib/hooks/use-term';
import { formatSemester } from '@/shared/lib/utils/utils';
import { FilterModal } from '@/shared/ui/adease';
import { getStudentFilterInfo } from '../_server/actions';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString().padStart(2, '0');
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'full'),
	};
});

const filterConfig = [
	{ key: 'schoolId' },
	{ key: 'programId' },
	{ key: 'termId' },
	{ key: 'semesterNumber' },
];

export default function StudentsFilter() {
	const params = useParams();
	const stdNo = params.id ? Number(params.id) : null;
	const queryClient = useQueryClient();

	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	const handleAutoFill = useCallback(async () => {
		if (!stdNo) return;
		const info = await getStudentFilterInfo(stdNo);
		if (!info) return;

		await queryClient.prefetchQuery({
			queryKey: ['schools'],
			queryFn: async () => getAllSchools(),
		});

		await queryClient.prefetchQuery({
			queryKey: ['programs', info.schoolId.toString()],
			queryFn: async () => getProgramsBySchoolId(info.schoolId),
		});

		const term = info.termCode ? await getTermByCode(info.termCode) : undefined;

		setFilter('schoolId', info.schoolId.toString());
		setFilter('programId', info.programId.toString());
		setFilter('termId', term?.id?.toString() || null);
		setFilter('semesterNumber', info.semesterNumber || null);
	}, [stdNo, queryClient, setFilter]);

	return (
		<FilterModal
			label='Filter Students'
			title='Filter Students'
			activeCount={activeCount}
			onApply={applyFilters}
			onClear={clearFilters}
			onOpen={sync}
		>
			{(opened) => (
				<StudentsFields
					opened={opened}
					filters={filters}
					setFilter={setFilter}
					stdNo={stdNo}
					onAutoFill={handleAutoFill}
				/>
			)}
		</FilterModal>
	);
}

type FieldsProps = {
	opened: boolean;
	filters: Record<string, string | null>;
	setFilter: (key: string, value: string | null) => void;
	stdNo: number | null;
	onAutoFill: () => void;
};

function StudentsFields({
	opened,
	filters,
	setFilter,
	stdNo,
	onAutoFill,
}: FieldsProps) {
	const { data: schools = [], isLoading: schoolLoading } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
		enabled: opened,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs', filters.schoolId],
		queryFn: () => getProgramsBySchoolId(Number(filters.schoolId)),
		enabled: !!filters.schoolId,
	});

	const { data: terms = [] } = useAllTerms();

	return (
		<>
			<Select
				label='School'
				placeholder='Select school'
				data={schools.map((school: { id: number; name: string }) => ({
					value: school.id?.toString() || '',
					label: school.name,
				}))}
				rightSection={schoolLoading && <Loader size='xs' />}
				value={filters.schoolId || null}
				onChange={(value) => {
					setFilter('schoolId', value);
					setFilter('programId', null);
				}}
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
				rightSection={programsLoading && <Loader size='xs' />}
				value={filters.programId || null}
				onChange={(value) => setFilter('programId', value)}
				searchable
				clearable
				disabled={!filters.schoolId}
			/>
			<Select
				label='Term'
				placeholder='Select term'
				data={terms.map((term) => ({
					value: term.id?.toString() || '',
					label: term.code,
				}))}
				value={filters.termId || null}
				onChange={(value) => setFilter('termId', value)}
				searchable
				clearable
			/>
			<Select
				label='Semester'
				placeholder='Select semester'
				data={semesterOptions}
				value={filters.semesterNumber || null}
				onChange={(value) => setFilter('semesterNumber', value)}
				searchable
				clearable
			/>
			{stdNo && (
				<Tooltip label='Fill from current student'>
					<ActionIcon variant='light' onClick={onAutoFill}>
						<IconFocus2 size='1rem' />
					</ActionIcon>
				</Tooltip>
			)}
		</>
	);
}
