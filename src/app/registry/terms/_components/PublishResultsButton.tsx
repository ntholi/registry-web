'use client';

import {
	Alert,
	Button,
	Checkbox,
	Group,
	Stack,
	Switch,
	Text,
	TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updateResultsPublishedWithNotification } from '../_server/settings-actions';

interface Props {
	termId: number;
	termCode: string;
	isPublished: boolean;
}

interface PublishOptions {
	sendNotification: boolean;
	closeGradebook: boolean;
	moveRejectedToBlocked: boolean;
}

export default function PublishResultsButton({
	termId,
	termCode,
	isPublished,
}: Props) {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (params: { publish: boolean; options: PublishOptions }) =>
			updateResultsPublishedWithNotification(
				termId,
				params.publish,
				termCode,
				params.options
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

	const openModal = () => {
		modals.open({
			title: isPublished ? 'Unpublish Results' : 'Publish Results',
			centered: true,
			children: (
				<PublishModalContent
					termCode={termCode}
					isPublished={isPublished}
					onConfirm={(options: PublishOptions) => {
						mutation.mutate({ publish: !isPublished, options });
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
	onConfirm: (options: PublishOptions) => void;
	isPending: boolean;
}

function PublishModalContent({
	termCode,
	isPublished,
	onConfirm,
	isPending,
}: ModalProps) {
	const [confirmation, setConfirmation] = useState('');
	const [sendNotification, setSendNotification] = useState(true);
	const [closeGradebook, setCloseGradebook] = useState(true);
	const [moveRejectedToBlocked, setMoveRejectedToBlocked] = useState(true);
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

			{isPublished && (
				<Text size='sm'>
					This will hide the grades and CGPA for term{' '}
					<strong>{termCode}</strong> from students.
				</Text>
			)}

			{!isPublished && (
				<>
					<Stack gap='xs'>
						<Switch
							label='Close gradebook access for lecturers'
							checked={closeGradebook}
							onChange={(e) => setCloseGradebook(e.currentTarget.checked)}
						/>
						<Switch
							label='Move rejected registration requests to blocked students'
							checked={moveRejectedToBlocked}
							onChange={(e) =>
								setMoveRejectedToBlocked(e.currentTarget.checked)
							}
						/>
					</Stack>
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
					onClick={() =>
						onConfirm({
							sendNotification,
							closeGradebook,
							moveRejectedToBlocked,
						})
					}
					loading={isPending}
					disabled={!isPublished && !isValid}
				>
					{isPublished ? 'Unpublish' : 'Publish'}
				</Button>
			</Group>
		</Stack>
	);
}
