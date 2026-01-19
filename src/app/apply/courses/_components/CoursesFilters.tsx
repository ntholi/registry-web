'use client';

import type { ProgramLevel } from '@academic/_database';
import type { SchoolSummary } from '@admissions/entry-requirements/_lib/types';
import { Chip, Group, ScrollArea, Stack } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function toSingleValue(nextValue: string | string[] | null) {
		if (!nextValue) {
			return undefined;
		}
		return Array.isArray(nextValue) ? nextValue[0] : nextValue;
	}

	function updateParam(key: string, nextValue?: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (nextValue) {
			params.set(key, nextValue);
		} else {
			params.delete(key);
		}
		params.delete('page');
		const queryString = params.toString();
		router.push(queryString ? `${pathname}?${queryString}` : pathname);
	}

	return (
		<Stack gap='xs'>
			<ScrollArea type='hover' offsetScrollbars>
				<Chip.Group
					value={value.level ?? 'all'}
					onChange={(nextValue) => {
						const resolved = toSingleValue(nextValue);
						updateParam('level', resolved === 'all' ? undefined : resolved);
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
			</ScrollArea>

			<ScrollArea type='hover' offsetScrollbars>
				<Chip.Group
					value={value.schoolId?.toString() ?? 'all'}
					onChange={(nextValue) => {
						const resolved = toSingleValue(nextValue);
						updateParam('schoolId', resolved === 'all' ? undefined : resolved);
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
								{school.code}
							</Chip>
						))}
					</Group>
				</Chip.Group>
			</ScrollArea>
		</Stack>
	);
}

function levelLabel(level: ProgramLevel) {
	return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}
