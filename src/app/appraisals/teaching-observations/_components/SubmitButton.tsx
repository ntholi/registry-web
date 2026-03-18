'use client';

import { Button, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import {
	getActionErrorMessage,
	isActionResult,
} from '@/shared/lib/actions/actionResult';
import type { ObservationDetailData } from '../_server/actions';
import { submitObservation } from '../_server/actions';

type SubmitButtonProps = {
	observation: ObservationDetailData;
};

const OPTIONAL_FIELDS = [
	{ key: 'strengths', label: 'Strengths' },
	{ key: 'improvements', label: 'Areas for Improvement' },
	{ key: 'recommendations', label: 'Recommendations' },
	{ key: 'trainingArea', label: 'Identified Training Area' },
] as const;

export default function SubmitButton({ observation }: SubmitButtonProps) {
	const queryClient = useQueryClient();
	const router = useRouter();

	const missing = OPTIONAL_FIELDS.filter((field) => {
		const value = observation[field.key];
		return !value?.trim();
	});

	const mutation = useMutation({
		mutationFn: () => submitObservation(observation.id),
		onSuccess: async (data) => {
			if (isActionResult(data) && !data.success) {
				notifications.show({
					title: 'Error',
					message: getActionErrorMessage(data.error),
					color: 'red',
				});
				return;
			}
			await queryClient.invalidateQueries({
				queryKey: ['teaching-observations'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Submitted',
				message: 'Observation submitted successfully',
				color: 'green',
			});
			router.refresh();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleSubmit() {
		if (missing.length === 0) {
			mutation.mutate();
			return;
		}

		modals.openConfirmModal({
			title: 'Incomplete Remarks',
			centered: true,
			children: (
				<Stack gap='sm'>
					<Text size='sm'>The following remarks have not been filled in:</Text>
					<Stack gap={4} pl='sm'>
						{missing.map((field) => (
							<Text key={field.key} size='sm' fw={500}>
								• {field.label}
							</Text>
						))}
					</Stack>
					<Text size='sm' c='dimmed'>
						You can go back and complete them, or submit anyway.
					</Text>
				</Stack>
			),
			labels: { confirm: 'Submit Anyway', cancel: 'Go Back' },
			onConfirm: () => mutation.mutate(),
		});
	}

	return (
		<Button
			leftSection={<IconSend size={16} />}
			color='blue'
			onClick={handleSubmit}
			loading={mutation.isPending}
		>
			Submit
		</Button>
	);
}
