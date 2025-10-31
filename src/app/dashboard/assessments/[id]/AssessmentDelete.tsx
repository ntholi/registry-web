import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Group,
	Modal,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { assessments } from '@/db/schema';
import { deleteAssessment } from '@/server/assessments/actions';
import { getAssessmentTypeLabel } from './assessments';

type Props = {
	assessment: typeof assessments.$inferSelect;
};

export default function AssessmentDelete({ assessment }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [confirmText, setConfirmText] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const queryClient = useQueryClient();

	const handleDelete = async () => {
		if (confirmText !== 'delete permanently') {
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
		setConfirmText('');
		setIsDeleting(false);
	};

	const handleClose = () => {
		resetForm();
		close();
	};

	const isConfirmed = confirmText === 'delete permanently';

	return (
		<>
			<Tooltip label="Delete">
				<ActionIcon variant="subtle" color="red" onClick={open}>
					<IconTrash size={16} />
				</ActionIcon>
			</Tooltip>

			<Modal opened={opened} onClose={handleClose} title="Delete Assessment" size="md" centered>
				<Box mb="md">
					<Alert icon={<IconAlertTriangle size={16} />} title="Warning" color="red" mb="md">
						<Text fw={500} mb="xs">
							You are about to delete {getAssessmentTypeLabel(assessment.assessmentType)}.
						</Text>
						<Text size="sm">
							This will permanently remove all student marks for this assessment. This action cannot
							be undone.
						</Text>
					</Alert>

					<Text size="sm" mb="md">
						To confirm deletion, please type{' '}
						<Text span fw={700}>
							delete permanently
						</Text>{' '}
						in the field below:
					</Text>

					<TextInput
						placeholder="delete permanently"
						value={confirmText}
						onChange={(e) => setConfirmText(e.currentTarget.value)}
						mb="md"
						data-autofocus
					/>
				</Box>

				<Group justify="right" mt="xl">
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button color="red" onClick={handleDelete} disabled={!isConfirmed} loading={isDeleting}>
						Delete Assessment
					</Button>
				</Group>
			</Modal>
		</>
	);
}
