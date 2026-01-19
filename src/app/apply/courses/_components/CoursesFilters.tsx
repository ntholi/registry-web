'use client';

import type { ProgramLevel } from '@academic/_database';
import type { SchoolSummary } from '@admissions/entry-requirements/_lib/types';
import { Chip, Group, ScrollArea } from '@mantine/core';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

interface CourseFilterValues {
	schoolId?: number;
	level?: ProgramLevel;
}

interface Props {
	schools: SchoolSummary[];
	levels: ProgramLevel[];
	value: CourseFilterValues;
}

export default function CoursesFilters({ schools, levels, value }: Props) {
	const [filter, setFilter] = useQueryStates(
		{
			schoolId: parseAsInteger,
			level: parseAsString,
			page: parseAsInteger,
		},
		{
			history: 'push',
			shallow: false,
		}
	);

	const levelValue = filter.level ?? value.level ?? null;
	const schoolValue = (filter.schoolId ?? value.schoolId)?.toString() ?? null;
	const levelsSorted = [...levels].sort((a, b) => b.localeCompare(a));
	const selectedLevel =
		levelValue && isProgramLevel(levelValue, levels) ? levelValue : null;
	const levelOptions = selectedLevel ? [selectedLevel] : levelsSorted;

	return (
		<ScrollArea type='hover' offsetScrollbars>
			<Group gap='md' wrap='nowrap'>
				<Chip
					value='all'
					variant='filled'
					checked={!levelValue && !schoolValue}
					onChange={() => {
						setFilter({
							level: null,
							schoolId: null,
							page: null,
						});
					}}
				>
					All
				</Chip>

				<Group gap='xs' wrap='nowrap'>
					{levelOptions.map((level) => (
						<Chip
							key={level}
							value={level}
							variant='filled'
							checked={selectedLevel === level}
							onChange={() => {
								setFilter({
									level: selectedLevel === level ? null : level,
									page: null,
								});
							}}
						>
							{levelLabel(level)}
						</Chip>
					))}
				</Group>

				<Group gap='xs' wrap='nowrap'>
					{schools.map((school) => (
						<Chip
							key={school.id}
							value={school.id.toString()}
							variant='filled'
							checked={schoolValue === school.id.toString()}
							onChange={() => {
								setFilter({
									schoolId:
										schoolValue === school.id.toString() ? null : school.id,
									page: null,
								});
							}}
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

function isProgramLevel(
	value: string,
	options: ProgramLevel[]
): value is ProgramLevel {
	return options.includes(value as ProgramLevel);
}
