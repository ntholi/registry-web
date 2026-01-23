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
	onSelect: () => void;
};

export default function CourseCard({
	program,
	selected,
	disabled,
	onSelect,
}: Props) {
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
			onClick={disabled ? undefined : onSelect}
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

					<Badge size='sm' color='gray' radius='sm'>
						{program.level}
					</Badge>
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
