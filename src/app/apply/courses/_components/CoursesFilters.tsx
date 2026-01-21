'use client';

import type { ProgramLevel } from '@academic/_database';
import type { SchoolSummary } from '@admissions/entry-requirements/_lib/types';
import { Chip, Group, ScrollArea } from '@mantine/core';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

interface Props {
	schools: SchoolSummary[];
	levels: ProgramLevel[];
}

export default function CoursesFilters({ schools, levels }: Props) {
	const [filters, setFilters] = useQueryStates({
		schoolId: parseAsInteger,
		level: parseAsString,
	});

	const levelsSorted = [...levels].sort((a, b) => b.localeCompare(a));

	return (
		<ScrollArea type='hover' offsetScrollbars>
			<Group gap='md' wrap='nowrap'>
				<Chip
					variant='filled'
					checked={!filters.level && !filters.schoolId}
					onChange={() => setFilters({ level: null, schoolId: null })}
				>
					All
				</Chip>

				<Group gap='xs' wrap='nowrap'>
					{levelsSorted.map((level) => (
						<Chip
							key={level}
							variant='filled'
							checked={filters.level === level}
							onChange={() =>
								setFilters({ level: filters.level === level ? null : level })
							}
						>
							{levelLabel(level)}
						</Chip>
					))}
				</Group>

				<Group gap='xs' wrap='nowrap'>
					{schools.map((school) => (
						<Chip
							key={school.id}
							variant='filled'
							checked={filters.schoolId === school.id}
							onChange={() =>
								setFilters({
									schoolId: filters.schoolId === school.id ? null : school.id,
								})
							}
						>
							{school.shortName ?? school.name}
						</Chip>
					))}
				</Group>
			</Group>
		</ScrollArea>
	);
}

function levelLabel(level: ProgramLevel) {
	return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}
