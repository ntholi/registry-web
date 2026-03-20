'use client';

import {
	ActionIcon,
	Button,
	FileInput,
	Group,
	Modal,
	SegmentedControl,
	Select,
	Stack,
	Textarea,
	TextInput,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPaperclip, IconPencil } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { authClient } from '@/core/auth-client';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import type { AccessibleAccount } from '../../_lib/types';
import { getAccessibleMailAccounts } from '../../accounts/_server/actions';
import { enqueueEmail, sendEmailDirect } from '../../queues/_server/actions';

export function ComposeModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();

	const { data: accounts = [] } = useQuery({
		queryKey: ['accessible-mail-accounts'],
		queryFn: () => getAccessibleMailAccounts() as Promise<AccessibleAccount[]>,
	});

	const composeAccounts = accounts.filter((a) => a.canCompose !== false);

	const [fromId, setFromId] = useState<string | null>(null);
	const [to, setTo] = useState('');
	const [cc, setCc] = useState('');
	const [bcc, setBcc] = useState('');
	const [subject, setSubject] = useState('');
	const [body, setBody] = useState('');
	const [showCcBcc, setShowCcBcc] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [sendMode, setSendMode] = useState<'queue' | 'direct'>('queue');

	function resetForm() {
		setFromId(null);
		setTo('');
		setCc('');
		setBcc('');
		setSubject('');
		setBody('');
		setShowCcBcc(false);
		setFiles([]);
		setSendMode('queue');
	}

	const { mutate, isPending } = useActionMutation(
		async (fd: FormData) =>
			sendMode === 'direct' ? sendEmailDirect(fd) : enqueueEmail(fd),
		{
			onSuccess: () => {
				close();
				resetForm();
				queryClient.invalidateQueries({ queryKey: ['mail-sent-log'] });
			},
		}
	);

	function handleSend() {
		const accountId = fromId ?? composeAccounts[0]?.id;
		if (!accountId || !to.trim() || !subject.trim()) return;

		const fd = new FormData();
		fd.set('mailAccountId', accountId);
		fd.set('to', to.trim());
		if (cc.trim()) fd.set('cc', cc.trim());
		if (bcc.trim()) fd.set('bcc', bcc.trim());
		fd.set('subject', subject.trim());
		fd.set('htmlBody', body.replace(/\n/g, '<br/>'));
		for (const file of files) {
			fd.append('files', file);
		}
		mutate(fd);
	}

	if (composeAccounts.length === 0) return null;

	return (
		<>
			<ActionIcon variant='light' size='md' onClick={open}>
				<IconPencil size={16} />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='Compose Email' size='lg'>
				<Stack gap='sm'>
					<Select
						label='From'
						value={fromId ?? composeAccounts[0]?.id}
						onChange={setFromId}
						data={composeAccounts.map((a) => ({
							value: a.id,
							label: a.displayName || a.email,
						}))}
					/>
					<TextInput
						label='To'
						placeholder='recipient@example.com'
						value={to}
						onChange={(e) => setTo(e.currentTarget.value)}
						required
					/>
					{!showCcBcc && (
						<UnstyledButton
							fz='xs'
							c='dimmed'
							onClick={() => setShowCcBcc(true)}
						>
							Add CC / BCC
						</UnstyledButton>
					)}
					{showCcBcc && (
						<>
							<TextInput
								label='CC'
								placeholder='cc@example.com'
								value={cc}
								onChange={(e) => setCc(e.currentTarget.value)}
							/>
							<TextInput
								label='BCC'
								placeholder='bcc@example.com'
								value={bcc}
								onChange={(e) => setBcc(e.currentTarget.value)}
							/>
						</>
					)}
					<TextInput
						label='Subject'
						value={subject}
						onChange={(e) => setSubject(e.currentTarget.value)}
						required
					/>
					<Textarea
						label='Body'
						minRows={6}
						autosize
						maxRows={14}
						value={body}
						onChange={(e) => setBody(e.currentTarget.value)}
					/>
					<FileInput
						label='Attachments'
						placeholder='Select files'
						multiple
						leftSection={<IconPaperclip size={16} />}
						value={files}
						onChange={setFiles}
						clearable
					/>
					<Group justify='space-between'>
						{session?.user?.role === 'admin' ? (
							<SegmentedControl
								size='xs'
								value={sendMode}
								onChange={(v) => setSendMode(v as 'queue' | 'direct')}
								data={[
									{ label: 'Queue', value: 'queue' },
									{ label: 'Send now', value: 'direct' },
								]}
							/>
						) : (
							<span />
						)}
						<Group>
							<Button variant='default' onClick={close}>
								Cancel
							</Button>
							<Button
								onClick={handleSend}
								loading={isPending}
								disabled={
									!to.trim() ||
									!subject.trim() ||
									!(fromId ?? composeAccounts[0]?.id)
								}
							>
								Send
							</Button>
						</Group>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
