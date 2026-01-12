'use client';

import {
	Alert,
	Button,
	Checkbox,
	Group,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
	hasRejectedStudentsForTerm,
	updateResultsPublishedWithNotification,
} from '../_server/settings-actions';

interface Props {
	termId: number;
	termCode: string;
	isPublished: boolean;
}

export default function PublishResultsButton({
	termId,
	termCode,
	isPublished,
}: Props) {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (params: { publish: boolean; sendNotification: boolean }) =>
			updateResultsPublishedWithNotification(
				termId,
				params.publish,
				termCode,
				params.sendNotification
			),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: isPublished
					? 'Results have been unpublished'
					: 'Results have been published successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['term-settings', termId] });
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const openModal = async () => {
		const hasRejected = await hasRejectedStudentsForTerm(termId);

		modals.open({
			title: isPublished ? 'Unpublish Results' : 'Publish Results',
			centered: true,
			children: (
				<PublishModalContent
					termCode={termCode}
					isPublished={isPublished}
					hasRejected={hasRejected}
					onConfirm={(sendNotification: boolean) => {
						mutation.mutate({ publish: !isPublished, sendNotification });
						modals.closeAll();
					}}
					isPending={mutation.isPending}
				/>
			),
		});
	};

	return (
		<Button
			color={isPublished ? 'orange' : 'green'}
			onClick={openModal}
			loading={mutation.isPending}
		>
			{isPublished ? 'Unpublish Results' : 'Publish Results'}
		</Button>
	);
}

interface ModalProps {
	termCode: string;
	isPublished: boolean;
	hasRejected: boolean;
	onConfirm: (sendNotification: boolean) => void;
	isPending: boolean;
}

function PublishModalContent({
	termCode,
	isPublished,
	hasRejected,
	onConfirm,
	isPending,
}: ModalProps) {
	const [confirmation, setConfirmation] = useState('');
	const [sendNotification, setSendNotification] = useState(true);
	const requiredText = 'publish results';
	const isValid = confirmation.toLowerCase() === requiredText;

	return (
		<Stack gap='md'>
			{!isPublished && (
				<Alert
					icon={<IconInfoCircle size={18} />}
					color='yellow'
					variant='light'
					title='Publishing Results'
				>
					This action will allow all students to view their grades and CGPA for
					term <strong>{termCode}</strong>.
				</Alert>
			)}

			{!isPublished && hasRejected && (
				<Alert
					icon={<IconAlertTriangle size={18} />}
					color='red'
					variant='light'
					title='Rejected Registrations'
				>
					There are rejected registration requests for this term that have not
					been moved to blocked students. Consider doing this first.
				</Alert>
			)}

			{isPublished && (
				<Text size='sm'>
					This will hide the grades and CGPA for term{' '}
					<strong>{termCode}</strong> from students.
				</Text>
			)}

			{!isPublished && (
				<>
					<Text size='sm'>
						To confirm, type <strong>{requiredText}</strong> below:
					</Text>
					<TextInput
						placeholder={requiredText}
						value={confirmation}
						onChange={(e) => setConfirmation(e.currentTarget.value)}
					/>
					<Checkbox
						label='Notify all students about published results'
						checked={sendNotification}
						onChange={(e) => setSendNotification(e.currentTarget.checked)}
					/>
				</>
			)}

			<Group justify='flex-end' mt='md'>
				<Button variant='light' color='gray' onClick={() => modals.closeAll()}>
					Cancel
				</Button>
				<Button
					color={isPublished ? 'orange' : 'green'}
					onClick={() => onConfirm(sendNotification)}
					loading={isPending}
					disabled={!isPublished && !isValid}
				>
					{isPublished ? 'Unpublish' : 'Publish'}
				</Button>
			</Group>
		</Stack>
	);
}
