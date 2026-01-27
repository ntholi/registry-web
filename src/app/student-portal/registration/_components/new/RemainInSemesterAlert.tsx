'use client';

import { Alert, Badge, Group, List, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

type Module = {
	id: number;
	code: string;
	name: string;
};

interface RemainInSemesterAlertProps {
	failedModules: Module[];
	supplementaryModules: Module[];
	details?: string;
}

export default function RemainInSemesterAlert({
	failedModules,
	supplementaryModules,
	details,
}: RemainInSemesterAlertProps) {
	return (
		<Alert
			icon={<IconAlertCircle size='1.5rem' />}
			title='Remain in Semester'
			color='red'
			variant='light'
		>
			<Stack gap='md'>
				<Text size='sm'>
					You are required to remain in your current semester due to outstanding
					academic requirements.
				</Text>
				{details && <Text size='sm'>{details}</Text>}
				{failedModules.length > 0 && (
					<div>
						<Group gap='xs' mb='xs'>
							<Text size='sm' fw={500}>
								Failed Modules (Must Repeat):
							</Text>
						</Group>
						<List size='sm' spacing='xs'>
							{failedModules.map((m) => (
								<List.Item key={m.id}>
									{m.code} - {m.name}
								</List.Item>
							))}
						</List>
					</div>
				)}
				{supplementaryModules.length > 0 && (
					<div>
						<Group gap='xs' mb='xs'>
							<Text size='sm' fw={500}>
								Supplementary Modules:
							</Text>
							<Badge color='orange' size='sm'>
								{supplementaryModules.length}
							</Badge>
						</Group>
						<List size='sm' spacing='xs'>
							{supplementaryModules.map((m) => (
								<List.Item key={m.id}>
									{m.code} - {m.name}
								</List.Item>
							))}
						</List>
					</div>
				)}
			</Stack>
		</Alert>
	);
}
