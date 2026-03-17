'use client';

import { createZohoContact } from '@finance/_lib/zoho-books/actions';
import { Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';

type Props = {
	stdNo: number;
};

export default function CreateContactBtn({ stdNo }: Props) {
	const queryClient = useQueryClient();

	const { mutate, isPending, isError, error } = useActionMutation(
		() => createZohoContact(stdNo),
		{
			onSuccess: (contactId) => {
				queryClient.setQueryData(['zoho-contact', stdNo], contactId);
				queryClient.invalidateQueries({
					queryKey: ['student-finance', contactId],
				});
			},
		}
	);

	return (
		<>
			{isError && (
				<Text size='sm' c='red' ta='center' maw={400}>
					{error instanceof Error
						? error.message
						: 'Failed to create contact. Please try again.'}
				</Text>
			)}
			<Button
				leftSection={<IconPlus size='1rem' />}
				onClick={() => mutate()}
				loading={isPending}
			>
				Create Zoho Contact
			</Button>
		</>
	);
}
