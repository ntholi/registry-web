'use client';

import type { assessments } from '@academic/_database';
import { ActionIcon, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteButton } from '@/shared/ui/adease';
import { getAssessmentTypeLabel } from '../_lib/utils';
import { deleteAssessment } from '../_server/actions';

type Props = {
	assessment: typeof assessments.$inferSelect;
};

export default function AssessmentDelete({ assessment }: Props) {
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
		<Tooltip label='Delete'>
			<DeleteButton
				handleDelete={handleDelete}
				itemName={getAssessmentTypeLabel(assessment.assessmentType)}
				itemType='assessment'
				warningMessage='This will permanently remove all student marks for this assessment. This action cannot be undone.'
			>
				<ActionIcon variant='subtle' color='red'>
					<IconTrash size={16} />
				</ActionIcon>
			</DeleteButton>
		</Tooltip>
	);
}
