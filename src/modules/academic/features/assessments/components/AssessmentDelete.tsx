'use client';

import { ActionIcon, Box, Button, Group, Modal, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { assessments } from '@/modules/academic/database';
import { DeleteConfirmContent } from '@/shared/ui/adease';
import { deleteAssessment } from '../server/actions';
import { getAssessmentTypeLabel } from '../utils';

type Props = {
	assessment: typeof assessments.$inferSelect;
};

export default function AssessmentDelete({ assessment }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const queryClient = useQueryClient();

	const handleDelete = async () => {
		if (!isConfirmed) {
			return;
		}

		try {
			setIsDeleting(true);
			await deleteAssessment(assessment.id);
			queryClient.invalidateQueries({
				queryKey: ['module', assessment.moduleId],
			});
			notifications.show({
				title: 'Success',
				message: 'Assessment deleted successfully',
				color: 'green',
			});
			close();
		} catch (error) {
			notifications.show({
				title: 'Error',
				message: `An error occurred while deleting the assessment: ${error}`,
				color: 'red',
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const resetForm = () => {
		setIsConfirmed(false);
		setIsDeleting(false);
	};

	const handleClose = () => {
		resetForm();
		close();
	};

	return (
		<>
			<Tooltip label='Delete'>
				<ActionIcon variant='subtle' color='red' onClick={open}>
					<IconTrash size={16} />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Delete Assessment'
				size='md'
				centered
			>
				<Box mb='md'>
					<DeleteConfirmContent
						itemName={getAssessmentTypeLabel(assessment.assessmentType)}
						itemType='assessment'
						warningMessage='This will permanently remove all student marks for this assessment. This action cannot be undone.'
						onConfirmChange={setIsConfirmed}
					/>
				</Box>

				<Group justify='right' mt='xl'>
					<Button variant='outline' onClick={handleClose}>
						Cancel
					</Button>
					<Button
						color='red'
						onClick={handleDelete}
						disabled={!isConfirmed}
						loading={isDeleting}
					>
						Delete Assessment
					</Button>
				</Group>
			</Modal>
		</>
	);
}
