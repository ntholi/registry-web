'use client';

import {
	ActionIcon,
	Button,
	Card,
	Group,
	Modal,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSend, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DashboardRole } from '@/core/auth/permissions';
import { authClient } from '@/core/auth-client';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { RichTextContent } from '@/shared/ui/adease';
import StudentInput from '@/shared/ui/StudentInput';
import StudentPreviewCard from '../../_components/StudentPreviewCard';
import { resolveTemplate } from '../_lib/resolve';
import {
	createRecipient,
	deleteRecipient,
	generateLetter,
	getActiveTemplates,
	getRecipientsByTemplate,
	getStudentForLetter,
} from '../_server/actions';

const SALUTATION_OPTIONS = [
	'Dear Sir/Madam,',
	'Dear Sir,',
	'Dear Madam,',
	'Dear Director,',
	'To Whom It May Concern,',
];

export default function GenerateLetterForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const [stdNo, setStdNo] = useState<number | null>(null);
	const [templateId, setTemplateId] = useState<string | null>(null);
	const [recipientId, setRecipientId] = useState<string | null>(null);
	const [salutation, setSalutation] = useState<string | null>(null);
	const [preview, setPreview] = useState<string | null>(null);

	const role = (session?.user?.role ?? undefined) as DashboardRole | undefined;

	const { data: templates } = useQuery({
		queryKey: ['letter-templates-active', role],
		queryFn: () => getActiveTemplates(role),
	});

	const { data: studentData } = useQuery({
		queryKey: ['student-for-letter', stdNo],
		queryFn: () => getStudentForLetter(stdNo!),
		enabled: !!stdNo,
	});

	const selectedTemplate = templates?.find((t) => t.id === templateId);

	const { data: recipients } = useQuery({
		queryKey: ['letter-recipients', templateId],
		queryFn: () => getRecipientsByTemplate(templateId!),
		enabled: !!templateId,
	});

	function handleTemplateChange(id: string | null) {
		setTemplateId(id);
		setRecipientId(null);
		setPreview(null);
		const tpl = templates?.find((t) => t.id === id);
		setSalutation(tpl?.salutation ?? 'Dear Sir/Madam,');
	}

	function handlePreview() {
		if (!selectedTemplate || !studentData) return;
		setPreview(resolveTemplate(selectedTemplate.content, studentData));
	}

	const mutation = useMutation({
		mutationFn: async () => {
			if (!templateId || !stdNo) return;
			return unwrap(
				await generateLetter(templateId, stdNo, {
					recipientId: recipientId ?? undefined,
					salutation: salutation ?? undefined,
				})
			);
		},
		onSuccess: (letter) => {
			if (!letter) return;
			queryClient.invalidateQueries({ queryKey: ['letters'] });
			router.push(`/registry/letters/generate/${letter.id}`);
		},
	});

	const recipientOptions =
		recipients?.map((r) => ({
			value: r.id,
			label: `${r.title}, ${r.org}${r.city ? `, ${r.city}` : ''}`,
		})) ?? [];

	const templateOptions =
		templates?.map((t) => ({ value: t.id, label: t.name })) ?? [];

	return (
		<Stack>
			<StudentInput
				value={stdNo ?? undefined}
				onChange={(val) => {
					setStdNo(typeof val === 'number' ? val : null);
					setPreview(null);
				}}
				required
			/>

			{studentData && (
				<StudentPreviewCard
					student={{ name: studentData.name, stdNo: studentData.stdNo }}
				/>
			)}

			<Select
				label='Letter Template'
				placeholder='Select a template...'
				data={templateOptions}
				value={templateId}
				onChange={handleTemplateChange}
				searchable
				required
			/>

			{templateId && (
				<>
					<Group align='end'>
						<Select
							label='Recipient'
							placeholder='Select recipient (optional)'
							data={recipientOptions}
							value={recipientId}
							onChange={setRecipientId}
							clearable
							searchable
							style={{ flex: 1 }}
						/>
						<NewRecipientModal
							templateId={templateId}
							onCreated={(id) => {
								queryClient.invalidateQueries({
									queryKey: ['letter-recipients', templateId],
								});
								setRecipientId(id);
							}}
						/>
						{recipientId && (
							<DeleteRecipientButton
								recipientId={recipientId}
								onDeleted={() => {
									setRecipientId(null);
									queryClient.invalidateQueries({
										queryKey: ['letter-recipients', templateId],
									});
								}}
							/>
						)}
					</Group>

					<Select
						label='Salutation'
						placeholder='Select a salutation'
						data={SALUTATION_OPTIONS}
						value={salutation}
						onChange={setSalutation}
						searchable
					/>
				</>
			)}

			<Group>
				<Button
					variant='light'
					onClick={handlePreview}
					disabled={!templateId || !studentData}
				>
					Preview
				</Button>
				<Button
					leftSection={<IconSend size={16} />}
					onClick={() => mutation.mutate()}
					loading={mutation.isPending}
					disabled={!templateId || !stdNo}
				>
					Generate Letter
				</Button>
			</Group>

			{preview && (
				<Card withBorder p='md'>
					<Text fw={600} size='sm' mb='xs'>
						Preview
					</Text>
					<RichTextContent html={preview} />
				</Card>
			)}
		</Stack>
	);
}

type NewRecipientModalProps = {
	templateId: string;
	onCreated: (id: string) => void;
};

function NewRecipientModal({ templateId, onCreated }: NewRecipientModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const form = useForm({
		initialValues: { title: '', org: '', address: '', city: '' },
	});

	const mutation = useMutation({
		mutationFn: async (values: typeof form.values) => {
			return unwrap(
				await createRecipient({
					templateId,
					title: values.title,
					org: values.org,
					address: values.address || null,
					city: values.city || null,
				})
			);
		},
		onSuccess: (data) => {
			if (!data) return;
			onCreated(data.id);
			form.reset();
			close();
		},
	});

	return (
		<>
			<ActionIcon variant='light' size='input-sm' onClick={open}>
				<IconPlus size={18} />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='New Recipient'>
				<form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
					<Stack>
						<TextInput
							label='Title'
							placeholder='e.g. The Director'
							required
							{...form.getInputProps('title')}
						/>
						<TextInput
							label='Organisation'
							placeholder='e.g. N.M.D.S.'
							required
							{...form.getInputProps('org')}
						/>
						<SimpleGrid cols={2}>
							<TextInput
								label='Address'
								placeholder='e.g. Box 517'
								{...form.getInputProps('address')}
							/>
							<TextInput
								label='City'
								placeholder='e.g. MASERU'
								{...form.getInputProps('city')}
							/>
						</SimpleGrid>
						<Group justify='flex-end'>
							<Button variant='default' onClick={close}>
								Cancel
							</Button>
							<Button type='submit' loading={mutation.isPending}>
								Add Recipient
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}

type DeleteRecipientButtonProps = {
	recipientId: string;
	onDeleted: () => void;
};

function DeleteRecipientButton({
	recipientId,
	onDeleted,
}: DeleteRecipientButtonProps) {
	const mutation = useMutation({
		mutationFn: async () => unwrap(await deleteRecipient(recipientId)),
		onSuccess: onDeleted,
	});

	return (
		<ActionIcon
			variant='light'
			color='red'
			size='input-sm'
			onClick={() => mutation.mutate()}
			loading={mutation.isPending}
		>
			<IconTrash size={18} />
		</ActionIcon>
	);
}
