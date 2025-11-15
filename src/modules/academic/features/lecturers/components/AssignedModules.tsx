'use client';

import { getAssignedModulesByUser } from '@academic/assigned-modules';
import {
	Avatar,
	Badge,
	Card,
	Group,
	Loader,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { users } from '@/modules/auth/database';
import { toClassName } from '@/shared/lib/utils/utils';
import DeleteModuleButton from './DeleteModuleButton';

type Props = {
	user: NonNullable<typeof users.$inferSelect>;
};

export default function AssignedModules({ user }: Props) {
	const { data: assignedModules, isLoading } = useQuery({
		queryKey: ['assigned-modules', user.id],
		queryFn: () => getAssignedModulesByUser(user.id),
	});

	if (isLoading) {
		return (
			<Group justify='center' py='xl'>
				<Loader />
			</Group>
		);
	}

	if (!assignedModules || assignedModules.length === 0) {
		return (
			<Card withBorder p='md'>
				<Text c='dimmed' ta='center'>
					No modules assigned yet
				</Text>
			</Card>
		);
	}

	return (
		<SimpleGrid cols={2} mt='md'>
			{assignedModules.map((assignment) => (
				<Card key={assignment.id} withBorder p='md' pos='relative'>
					<DeleteModuleButton
						assignmentId={assignment.id}
						moduleName={
							assignment.semesterModule?.module?.name || 'Unknown Module'
						}
						userId={user.id}
						pos='absolute'
						top={8}
						right={8}
					/>{' '}
					<Group gap='md' align='flex-start'>
						<Avatar size={70} radius='md' variant='default'>
							<Text ff={'monospace'} size='xs' fw={700} ta='center'>
								{assignment.semesterModule?.module?.code || 'N/A'}
							</Text>
						</Avatar>
						<Stack gap='xs' style={{ flex: 1 }}>
							<Text fw={500} size='md'>
								{assignment.semesterModule?.module?.name || 'Unknown Module'}
							</Text>

							{assignment.semesterModule?.semester?.name && (
								<Badge variant='light' color='gray' size='sm'>
									{toClassName(
										assignment.semesterModule.semester.structure.program.code,
										assignment.semesterModule.semester.name
									)}
								</Badge>
							)}
						</Stack>
					</Group>
				</Card>
			))}
		</SimpleGrid>
	);
}
