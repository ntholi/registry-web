'use client';

import { Alert, Box, List, Stack, Text } from '@mantine/core';
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
				<Box>
					<Text size='sm'>
						You are required to remain in your current semester due to
						outstanding academic requirements.
					</Text>
					{details && (
						<Text size='sm' fs={'italic'}>
							{details}
						</Text>
					)}
				</Box>
				{failedModules.length > 0 && (
					<div>
						<Text size='sm' fw={500}>
							Failed Modules (Must Repeat):
						</Text>
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
						<Text size='sm' fw={500}>
							Supplementary Modules:
						</Text>
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
