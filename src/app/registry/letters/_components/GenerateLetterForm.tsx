'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Input,
	Modal,
	Paper,
	ScrollArea,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconFileText, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DashboardRole } from '@/core/auth/permissions';
import { authClient } from '@/core/auth-client';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { DeleteButton } from '@/shared/ui/adease';
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
import LetterPreview from './LetterPreview';

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

	const [previewOpened, { open: openPreview, close: closePreview }] =
		useDisclosure(false);

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

	if (recipients?.length && !recipientId && templateId) {
		setRecipientId(recipients[0].id);
	}

	function handlePreview() {
		if (!selectedTemplate || !studentData) return;
		setPreview(resolveTemplate(selectedTemplate.content, studentData));
		openPreview();
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

			<TemplatePicker
				templates={templates ?? []}
				value={templateId}
				onChange={handleTemplateChange}
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
							<DeleteButton
								handleDelete={async () => {
									await unwrap(await deleteRecipient(recipientId));
								}}
								onSuccess={() => {
									setRecipientId(null);
								}}
								queryKey={['letter-recipients', templateId]}
								itemType='recipient'
								itemName={recipients?.find((r) => r.id === recipientId)?.title}
								warningMessage='This recipient will be removed from the template. This action cannot be undone.'
								variant='light'
								color='red'
								size='input-sm'
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

			<Group justify='space-between'>
				<Button
					variant='light'
					onClick={handlePreview}
					disabled={!templateId || !studentData}
				>
					Preview
				</Button>
				<Button
					onClick={() => mutation.mutate()}
					loading={mutation.isPending}
					disabled={!templateId || !stdNo}
				>
					Generate Letter
				</Button>
			</Group>

			<Modal
				opened={previewOpened}
				onClose={closePreview}
				title='Letter Preview'
				size='lg'
				centered
			>
				{preview && (
					<LetterPreview
						content={preview}
						recipient={recipients?.find((r) => r.id === recipientId)}
						salutation={salutation}
						subject={
							selectedTemplate?.subject && studentData
								? resolveTemplate(selectedTemplate.subject, studentData)
								: null
						}
						signOffName={selectedTemplate?.signOffName}
						signOffTitle={selectedTemplate?.signOffTitle}
					/>
				)}
			</Modal>
		</Stack>
	);
}

type TemplatePickerProps = {
	templates: {
		id: string;
		name: string;
		subject: string | null;
		role: string | null;
	}[];
	value: string | null;
	onChange: (id: string | null) => void;
};

function TemplatePicker({ templates, value, onChange }: TemplatePickerProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const selected = templates.find((t) => t.id === value);

	return (
		<>
			<Input.Wrapper label='Letter Template' required>
				<UnstyledButton
					onClick={open}
					style={{ display: 'block', width: '100%' }}
				>
					<Paper
						withBorder
						p='sm'
						mt={4}
						style={(theme) => ({
							borderRadius: theme.radius.sm,
							borderColor: selected ? theme.colors.blue[6] : undefined,
							transition: 'border-color 150ms',
							cursor: 'pointer',
						})}
					>
						{selected ? (
							<Group gap='sm'>
								<ThemeIcon variant='light' size='lg' radius='md'>
									<IconFileText size={18} />
								</ThemeIcon>
								<Box style={{ flex: 1, minWidth: 0 }}>
									<Text fw={600} size='sm' lineClamp={1}>
										{selected.name}
									</Text>
									{selected.subject && (
										<Text size='xs' c='dimmed' lineClamp={1}>
											{selected.subject}
										</Text>
									)}
								</Box>
								{selected.role && (
									<Badge size='xs' variant='light'>
										{selected.role}
									</Badge>
								)}
							</Group>
						) : (
							<Group gap='sm'>
								<ThemeIcon variant='light' size='lg' radius='md' color='gray'>
									<IconFileText size={18} />
								</ThemeIcon>
								<Text size='sm' c='dimmed'>
									Click to choose a letter template…
								</Text>
							</Group>
						)}
					</Paper>
				</UnstyledButton>
			</Input.Wrapper>

			<Modal
				opened={opened}
				onClose={close}
				title='Choose a Letter Template'
				size='xl'
				centered
				scrollAreaComponent={ScrollArea.Autosize}
			>
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
					{templates.map((tpl) => (
						<UnstyledButton
							key={tpl.id}
							onClick={() => {
								onChange(tpl.id);
								close();
							}}
						>
							<Card
								withBorder
								padding='lg'
								radius='md'
								style={(theme) => ({
									borderColor:
										value === tpl.id ? theme.colors.blue[6] : undefined,
									borderWidth: value === tpl.id ? 2 : 1,
									transition: 'border-color 150ms, box-shadow 150ms',
									height: '100%',
									cursor: 'pointer',
								})}
							>
								<Stack gap='xs'>
									<ThemeIcon
										variant='light'
										size='xl'
										radius='md'
										color={value === tpl.id ? 'blue' : 'gray'}
									>
										<IconFileText size={22} />
									</ThemeIcon>
									<Box>
										<Text fw={600} size='sm' lineClamp={2}>
											{tpl.name}
										</Text>
										{tpl.subject && (
											<Text size='xs' c='dimmed' lineClamp={2} mt={2}>
												{tpl.subject}
											</Text>
										)}
									</Box>
									{tpl.role && (
										<Badge size='xs' variant='light' w='fit-content'>
											{tpl.role}
										</Badge>
									)}
								</Stack>
							</Card>
						</UnstyledButton>
					))}
				</SimpleGrid>
			</Modal>
		</>
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
