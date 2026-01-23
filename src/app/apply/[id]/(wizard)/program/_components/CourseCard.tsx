'use client';

import type { ProgramLevel } from '@academic/_database';
import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconSchool } from '@tabler/icons-react';

type EligibleProgram = {
	id: number;
	name: string;
	code: string;
	level: ProgramLevel;
	schoolId: number;
	school: {
		id: number;
		code: string;
		name: string;
		shortName: string | null;
	};
};

type Props = {
	program: EligibleProgram;
	selected: boolean;
	disabled: boolean;
	onToggle: (selected: boolean) => void;
};

export default function CourseCard({
	program,
	selected,
	disabled,
	onToggle,
}: Props) {
	function handleClick() {
		if (disabled) return;
		onToggle(!selected);
	}

	return (
		<Card
			withBorder
			radius='md'
			p='md'
			style={{
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				borderColor: selected
					? 'var(--mantine-color-blue-5)'
					: 'var(--mantine-color-default-border)',
				borderWidth: selected ? 2 : 1,
			}}
			onClick={handleClick}
		>
			<Group wrap='nowrap' align='flex-start' gap='md'>
				<Stack gap='xs' style={{ flex: 1 }}>
					<Group gap='xs' wrap='nowrap'>
						<ThemeIcon
							size='md'
							variant='light'
							color={selected ? 'blue' : 'gray'}
							radius='md'
						>
							<IconSchool size={16} />
						</ThemeIcon>
						<Text fw={600} size='sm' lh={1.3} style={{ flex: 1 }}>
							{program.name}
						</Text>
					</Group>

					<Group gap='xs' ml={32}>
						{program.school.shortName && (
							<Badge size='sm' color='gray' radius='sm'>
								{program.school.shortName}
							</Badge>
						)}
					</Group>
				</Stack>

				{selected && (
					<ThemeIcon size='md' variant='filled' color='blue' radius='xl'>
						<IconCheck size={14} stroke={3} />
					</ThemeIcon>
				)}
			</Group>
		</Card>
	);
}
