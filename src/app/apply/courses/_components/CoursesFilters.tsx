'use client';

import type { ProgramLevel } from '@academic/_database';
import type { SchoolSummary } from '@admissions/entry-requirements/_lib/types';
import { Chip, Group, ScrollArea } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
	schools: SchoolSummary[];
	levels: ProgramLevel[];
	value: { schoolId?: number; level?: ProgramLevel };
}

export default function CoursesFilters({ schools, levels, value }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentLevel = searchParams.get('level') ?? value.level ?? null;
	const currentSchoolId =
		searchParams.get('schoolId') ?? value.schoolId?.toString() ?? null;

	const navigate = useCallback(
		(updates: Record<string, string | null>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, val] of Object.entries(updates)) {
				if (val === null) {
					params.delete(key);
				} else {
					params.set(key, val);
				}
			}
			params.delete('page');
			const query = params.toString();
			router.push(query ? `${pathname}?${query}` : pathname);
		},
		[router, pathname, searchParams]
	);

	const levelsSorted = [...levels].sort((a, b) => b.localeCompare(a));

	return (
		<ScrollArea type='hover' offsetScrollbars>
			<Group gap='md' wrap='nowrap'>
				<Chip
					variant='filled'
					checked={!currentLevel && !currentSchoolId}
					onChange={() => navigate({ level: null, schoolId: null })}
				>
					All
				</Chip>

				<Group gap='xs' wrap='nowrap'>
					{levelsSorted.map((level) => (
						<Chip
							key={level}
							variant='filled'
							checked={currentLevel === level}
							onChange={() =>
								navigate({ level: currentLevel === level ? null : level })
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
							checked={currentSchoolId === school.id.toString()}
							onChange={() =>
								navigate({
									schoolId:
										currentSchoolId === school.id.toString()
											? null
											: school.id.toString(),
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
