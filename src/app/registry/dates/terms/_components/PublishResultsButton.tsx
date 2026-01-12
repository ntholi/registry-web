'use client';

import { Box, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
	hasRejectedStudentsForTerm,
	updateResultsPublished,
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
		mutationFn: (publish: boolean) => updateResultsPublished(termId, publish),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: isPublished
					? 'Results have been unpublished'
					: 'Results have been published successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['terms'] });
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
					onConfirm={() => {
						mutation.mutate(!isPublished);
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
	onConfirm: () => void;
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
	const requiredText = 'publish results';
	const isValid = confirmation.toLowerCase() === requiredText;

	return (
		<Stack gap='md'>
			{!isPublished && (
				<Box
					bg='yellow.1'
					p='sm'
					style={{ borderRadius: 'var(--mantine-radius-sm)' }}
				>
					<Group gap='xs' wrap='nowrap'>
						<IconAlertTriangle
							size={20}
							color='var(--mantine-color-yellow-7)'
						/>
						<Text size='sm' c='yellow.9'>
							This action will allow all students to view their grades and CGPA
							for term <strong>{termCode}</strong>.
						</Text>
					</Group>
				</Box>
			)}

			{!isPublished && hasRejected && (
				<Box
					bg='red.1'
					p='sm'
					style={{ borderRadius: 'var(--mantine-radius-sm)' }}
				>
					<Group gap='xs' wrap='nowrap'>
						<IconAlertTriangle size={20} color='var(--mantine-color-red-7)' />
						<Text size='sm' c='red.9'>
							There are rejected registration requests for this term that have
							not been moved to blocked students. Consider doing this first.
						</Text>
					</Group>
				</Box>
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
				</>
			)}

			<Group justify='flex-end' mt='md'>
				<Button variant='light' color='gray' onClick={() => modals.closeAll()}>
					Cancel
				</Button>
				<Button
					color={isPublished ? 'orange' : 'green'}
					onClick={onConfirm}
					loading={isPending}
					disabled={!isPublished && !isValid}
				>
					{isPublished ? 'Unpublish' : 'Publish'}
				</Button>
			</Group>
		</Stack>
	);
}
