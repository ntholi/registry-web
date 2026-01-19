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

	const levelValue = filter.level ?? value.level ?? 'all';
	const schoolValue = (filter.schoolId ?? value.schoolId)?.toString() ?? 'all';

	return (
		<ScrollArea type='hover' offsetScrollbars>
			<Group gap='md' wrap='nowrap'>
				<Chip.Group
					value={levelValue}
					onChange={(nextValue) => {
						const resolved = toSingleValue(nextValue);
						setFilter({
							level: resolved === 'all' ? null : resolved,
							page: null,
						});
					}}
				>
					<Group gap='xs' wrap='nowrap'>
						<Chip value='all' variant='filled'>
							All
						</Chip>
						{levels.map((level) => (
							<Chip key={level} value={level} variant='filled'>
								{levelLabel(level)}
							</Chip>
						))}
					</Group>
				</Chip.Group>

				<Chip.Group
					value={schoolValue}
					onChange={(nextValue) => {
						const resolved = toSingleValue(nextValue);
						setFilter({
							schoolId: resolved === 'all' ? null : Number(resolved),
							page: null,
						});
					}}
				>
					<Group gap='xs' wrap='nowrap'>
						<Chip value='all' variant='filled'>
							All
						</Chip>
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
