'use client';

import type { ProgramLevel } from '@academic/_database';
import { Chip, Group, ScrollArea, Text } from '@mantine/core';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

const levelOptions: { value: ProgramLevel; label: string }[] = [
	{ value: 'certificate', label: 'Certificate' },
	{ value: 'diploma', label: 'Diploma' },
	{ value: 'degree', label: 'Degree' },
];

type School = {
	id: number;
	shortName: string | null;
	name: string;
};

type Props = {
	schools: School[];
};

export default function CoursesFilter({ schools }: Props) {
	const [filters, setFilters] = useQueryStates({
		schoolId: parseAsInteger,
		level: parseAsString,
	});

	return (
		<ScrollArea scrollbarSize={6} offsetScrollbars>
			<Group gap='lg' wrap='nowrap' pb='xs'>
				<Group gap='xs' wrap='nowrap'>
					<Text size='xs' c='dimmed' fw={500}>
						School:
					</Text>
					<Chip.Group
						multiple={false}
						value={filters.schoolId?.toString() ?? ''}
						onChange={(val) =>
							setFilters({ schoolId: val ? Number(val) : null })
						}
					>
						<Group gap={6} wrap='nowrap'>
							{schools.map((school) => (
								<Chip key={school.id} value={school.id.toString()} size='xs'>
									{school.shortName ?? school.name}
								</Chip>
							))}
						</Group>
					</Chip.Group>
				</Group>

				<Group gap='xs' wrap='nowrap'>
					<Text size='xs' c='dimmed' fw={500}>
						Level:
					</Text>
					<Chip.Group
						multiple={false}
						value={filters.level ?? ''}
						onChange={(val) => setFilters({ level: val || null })}
					>
						<Group gap={6} wrap='nowrap'>
							{levelOptions.map((opt) => (
								<Chip key={opt.value} value={opt.value} size='xs'>
									{opt.label}
								</Chip>
							))}
						</Group>
					</Chip.Group>
				</Group>
			</Group>
		</ScrollArea>
	);
}
