'use client';

import { Button, Stack, Textarea } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { replyToThread } from '../../accounts/_server/actions';

type Props = {
	accountId: string;
	threadId: string;
};

export function ReplyEditor({ accountId, threadId }: Props) {
	const [body, setBody] = useState('');
	const queryClient = useQueryClient();

	const { mutate, isPending } = useActionMutation(
		(html: string) => replyToThread(accountId, threadId, html),
		{
			onSuccess: () => {
				setBody('');
				queryClient.invalidateQueries({
					queryKey: ['mail-thread', accountId, threadId],
				});
			},
		}
	);

	function handleSend() {
		if (!body.trim()) return;
		const html = body.replace(/\n/g, '<br/>');
		mutate(html);
	}

	return (
		<Stack gap='xs'>
			<Textarea
				placeholder='Write a reply...'
				minRows={4}
				autosize
				maxRows={10}
				value={body}
				onChange={(e) => setBody(e.currentTarget.value)}
			/>
			<Button
				onClick={handleSend}
				loading={isPending}
				disabled={!body.trim()}
				size='sm'
				ml='auto'
			>
				Send Reply
			</Button>
		</Stack>
	);
}
