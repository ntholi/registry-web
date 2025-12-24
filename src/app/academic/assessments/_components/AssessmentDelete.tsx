'use client';

import type { assessments } from '@academic/_database';
import { ActionIcon, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteModal } from '@/shared/ui/adease';
import { getAssessmentTypeLabel } from '../_lib/utils';
import { deleteAssessment } from '../_server/actions';

type Props = {
	assessment: typeof assessments.$inferSelect;
};

export default function AssessmentDelete({ assessment }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	async function handleDelete() {
		try {
			await deleteAssessment(assessment.id);
			queryClient.invalidateQueries({
				queryKey: ['module', assessment.moduleId],
			});
			notifications.show({
				title: 'Success',
				message: 'Assessment deleted successfully',
				color: 'green',
			});
		} catch (error) {
			notifications.show({
				title: 'Error',
				message: `An error occurred while deleting the assessment: ${error}`,
				color: 'red',
			});
			throw error;
		}
	}

	return (
		<>
			<Tooltip label='Delete'>
				<ActionIcon variant='subtle' color='red' onClick={open}>
					<IconTrash size={16} />
				</ActionIcon>
			</Tooltip>

			<DeleteModal
				opened={opened}
				onClose={close}
				onDelete={handleDelete}
				itemName={getAssessmentTypeLabel(assessment.assessmentType)}
				itemType='assessment'
				warningMessage='This will permanently remove all student marks for this assessment. This action cannot be undone.'
			/>
		</>
	);
}
