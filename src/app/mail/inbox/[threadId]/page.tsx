'use client';

import {
	ActionIcon,
	Anchor,
	Box,
	Button,
	Collapse,
	Divider,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconArrowLeft,
	IconChevronDown,
	IconChevronUp,
	IconPaperclip,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { useDownload } from '@/shared/lib/hooks/use-download';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { formatFileSize } from '@/shared/lib/utils/files';
import type { ThreadMessage } from '../../_lib/types';
import {
	downloadAttachment,
	getThread,
	markRead,
} from '../../accounts/_server/actions';
import { ReplyEditor } from '../_components/ReplyEditor';

export default function ThreadDetailPage() {
	const { threadId } = useParams<{ threadId: string }>();
	const searchParams = useSearchParams();
	const accountId = searchParams.get('account') || '';
	const queryClient = useQueryClient();

	const { data, isLoading, isError } = useQuery({
		queryKey: ['mail-thread', accountId, threadId],
		queryFn: () => getThread(accountId, threadId),
		enabled: !!accountId && !!threadId,
	});

	const markedRef = useRef(false);
	const { mutate: doMarkRead } = useActionMutation(
		(args: { accountId: string; messageId: string }) =>
			markRead(args.accountId, args.messageId),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ['inbox-threads'],
				});
			},
		}
	);

	useEffect(() => {
		if (!data?.messages?.length || markedRef.current) return;
		const unread = data.messages.filter((m) => !m.isRead);
		if (unread.length > 0) {
			markedRef.current = true;
			for (const msg of unread) {
				doMarkRead({ accountId, messageId: msg.messageId });
			}
		}
	}, [data, accountId, doMarkRead]);

	if (isLoading) {
		return (
			<Stack align='center' justify='center' h={300}>
				<Loader />
			</Stack>
		);
	}

	if (!data) {
		return (
			<Stack align='center' justify='center' h={300}>
				<Text c='dimmed'>
					{isError ? 'Failed to load thread' : 'Thread not found'}
				</Text>
			</Stack>
		);
	}

	const messages = data.messages;
	const subject = messages[0]?.subject || '(No Subject)';

	return (
		<Stack p='md' gap='md'>
			<Group>
				<ActionIcon variant='subtle' component={Link} href='/mail/inbox'>
					<IconArrowLeft size={18} />
				</ActionIcon>
				<Title order={4} fw={500} style={{ flex: 1 }}>
					{subject}
				</Title>
				<Text size='sm' c='dimmed'>
					{messages.length} message{messages.length !== 1 ? 's' : ''}
				</Text>
			</Group>

			<Divider />

			<MessageList messages={messages} accountId={accountId} />

			<Divider />

			<ReplyEditor accountId={accountId} threadId={threadId} />
		</Stack>
	);
}

type MessageListProps = {
	messages: ThreadMessage[];
	accountId: string;
};

function MessageList({ messages, accountId }: MessageListProps) {
	const [expanded, { toggle }] = useDisclosure(false);

	if (messages.length <= 2) {
		return (
			<Stack gap='md'>
				{messages.map((msg) => (
					<MessageCard
						key={msg.messageId}
						message={msg}
						accountId={accountId}
					/>
				))}
			</Stack>
		);
	}

	const first = messages[0];
	const last = messages[messages.length - 1];
	const middle = messages.slice(1, -1);

	return (
		<Stack gap='md'>
			<MessageCard message={first} accountId={accountId} />
			{middle.length > 0 && (
				<>
					<Button
						variant='subtle'
						size='xs'
						onClick={toggle}
						leftSection={
							expanded ? (
								<IconChevronUp size={14} />
							) : (
								<IconChevronDown size={14} />
							)
						}
					>
						{expanded
							? 'Collapse'
							: `${middle.length} more message${middle.length > 1 ? 's' : ''}`}
					</Button>
					<Collapse in={expanded}>
						<Stack gap='md'>
							{middle.map((msg) => (
								<MessageCard
									key={msg.messageId}
									message={msg}
									accountId={accountId}
								/>
							))}
						</Stack>
					</Collapse>
				</>
			)}
			<MessageCard message={last} accountId={accountId} />
		</Stack>
	);
}

type MessageCardProps = {
	message: ThreadMessage;
	accountId: string;
};

function MessageCard({ message, accountId }: MessageCardProps) {
	return (
		<Paper withBorder p='md' radius='sm'>
			<Stack gap='xs'>
				<Group justify='space-between' wrap='nowrap'>
					<Box style={{ flex: 1, minWidth: 0 }}>
						<Text size='sm' fw={600} truncate='end'>
							{message.from.name || message.from.email}
							{message.from.name && (
								<Text span size='xs' c='dimmed' ml={4}>
									&lt;{message.from.email}&gt;
								</Text>
							)}
						</Text>
						<Text size='xs' c='dimmed' truncate='end'>
							To: {message.to}
							{message.cc && ` · CC: ${message.cc}`}
						</Text>
					</Box>
					<Text size='xs' c='dimmed' style={{ flexShrink: 0 }}>
						{formatDateTime(message.receivedAt, 'short')}
					</Text>
				</Group>

				<EmailBody html={message.htmlBody} text={message.textBody} />

				{message.attachments.length > 0 && (
					<>
						<Divider />
						<Stack gap={4}>
							{message.attachments.map((att) => (
								<AttachmentLink
									key={att.attachmentId}
									accountId={accountId}
									messageId={message.messageId}
									attachmentId={att.attachmentId}
									filename={att.filename}
									mimeType={att.mimeType}
									size={att.size}
								/>
							))}
						</Stack>
					</>
				)}
			</Stack>
		</Paper>
	);
}

type EmailBodyProps = {
	html: string;
	text: string;
};

function EmailBody({ html, text }: EmailBodyProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		const resizeObserver = new ResizeObserver(() => {
			const doc = iframe.contentDocument;
			if (doc?.body) {
				iframe.style.height = `${doc.body.scrollHeight + 16}px`;
			}
		});

		const handleLoad = () => {
			const doc = iframe.contentDocument;
			if (doc?.body) {
				iframe.style.height = `${doc.body.scrollHeight + 16}px`;
				resizeObserver.observe(doc.body);
			}
		};

		iframe.addEventListener('load', handleLoad);
		return () => {
			iframe.removeEventListener('load', handleLoad);
			resizeObserver.disconnect();
		};
	}, []);

	if (!html && !text) {
		return (
			<Text size='sm' c='dimmed' fs='italic'>
				(Empty message)
			</Text>
		);
	}

	if (!html) {
		return (
			<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
				{text}
			</Text>
		);
	}

	const styledHtml = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
					font-size: 14px;
					line-height: 1.5;
					color: inherit;
					margin: 0;
					padding: 0;
					overflow: hidden;
				}
				a { color: #228be6; }
				img { max-width: 100%; height: auto; }
				blockquote {
					border-left: 3px solid #dee2e6;
					margin: 8px 0;
					padding: 4px 12px;
					color: #868e96;
				}
			</style>
		</head>
		<body>${html}</body>
		</html>
	`;

	return (
		<iframe
			ref={iframeRef}
			srcDoc={styledHtml}
			sandbox='allow-same-origin'
			style={{
				width: '100%',
				border: 'none',
				minHeight: 60,
				overflow: 'hidden',
			}}
			title='Email content'
		/>
	);
}

type AttachmentLinkProps = {
	accountId: string;
	messageId: string;
	attachmentId: string;
	filename: string;
	mimeType: string;
	size: number;
};

function AttachmentLink({
	accountId,
	messageId,
	attachmentId,
	filename,
	mimeType,
	size,
}: AttachmentLinkProps) {
	const { downloadFromBase64 } = useDownload();

	const { mutate, isPending } = useActionMutation(
		() => downloadAttachment(accountId, messageId, attachmentId),
		{
			onSuccess: (result) => {
				downloadFromBase64(result.data, filename, mimeType);
			},
		}
	);

	return (
		<Group gap='xs'>
			<IconPaperclip size={14} opacity={0.5} />
			<Anchor
				component='button'
				size='xs'
				onClick={() => mutate()}
				disabled={isPending}
			>
				{filename}
			</Anchor>
			<Text size='xs' c='dimmed'>
				({formatFileSize(size)})
			</Text>
			{isPending && <Loader size={12} />}
		</Group>
	);
}
