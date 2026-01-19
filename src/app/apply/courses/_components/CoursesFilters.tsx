'use client';

import type { ProgramLevel } from '@academic/_database';
import type { SchoolSummary } from '@admissions/entry-requirements/_lib/types';
import { Chip, Group, ScrollArea } from '@mantine/core';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

interface CourseFilterValues {
	schoolId?: number;
	level?: ProgramLevel;
}

interface CoursesFiltersProps {
	schools: SchoolSummary[];
	levels: ProgramLevel[];
	value: CourseFilterValues;
}

export default function CoursesFilters({
	schools,
	levels,
	value,
}: CoursesFiltersProps) {
	const [filter, setFilter] = useQueryStates({
		schoolId: parseAsInteger,
		level: parseAsString,
		page: parseAsInteger,
	});

	function toSingleValue(nextValue: string | string[] | null) {
		if (!nextValue) {
			return undefined;
		}
		return Array.isArray(nextValue) ? nextValue[0] : nextValue;
	}

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

				<Chip.Group
					value={selectedLevel ?? undefined}
					onChange={(nextValue) => {
						const resolved = toSingleValue(nextValue);
						setFilter({
							level:
								resolved && isProgramLevel(resolved, levels) ? resolved : null,
							page: null,
						});
					}}
				>
					<Group gap='xs' wrap='nowrap'>
						{levelOptions.map((level) => (
							<Chip key={level} value={level} variant='filled'>
								{levelLabel(level)}
							</Chip>
						))}
					</Group>
				</Chip.Group>

				<Chip.Group
					value={schoolValue ?? undefined}
					onChange={(nextValue) => {
						const resolved = toSingleValue(nextValue);
						setFilter({
							schoolId: resolved ? Number(resolved) : null,
							page: null,
						});
					}}
				>
					<Group gap='xs' wrap='nowrap'>
						{schools.map((school) => (
							<Chip
								key={school.id}
								value={school.id.toString()}
								variant='filled'
							>
								{school.shortName ?? school.name}
							</Chip>
						))}
					</Group>
				</Chip.Group>
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
