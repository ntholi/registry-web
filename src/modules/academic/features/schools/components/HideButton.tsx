'use client';

import { updateModuleVisibility } from '@academic/semester-modules';
import { ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getVisibilityColor } from '@student-portal/utils';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Props = {
	moduleId: number;
	hidden: boolean;
	structureId: number;
};

export default function HideButton({ moduleId, hidden, structureId }: Props) {
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			return await updateModuleVisibility(moduleId, !hidden);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['structure', structureId],
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error
						? error.message
						: 'Failed to update module visibility',
				color: 'red',
			});
		},
	});

	return (
		<ActionIcon
			variant='subtle'
			onClick={() => mutate()}
			loading={isPending}
			color={getVisibilityColor(hidden)}
		>
			{hidden ? <IconEyeOff size={'1rem'} /> : <IconEye size={'1rem'} />}
		</ActionIcon>
	);
}
