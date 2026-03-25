'use client';

import {
	ActionIcon,
	Badge,
	Button,
	Divider,
	Fieldset,
	Group,
	Menu,
	Select,
	SimpleGrid,
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
} from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { letterTemplates } from '@registry/_database';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { Form } from '@/shared/ui/adease';
import '@mantine/tiptap/styles.css';
import { Link } from '@mantine/tiptap';
import { IconChevronRight, IconTemplate, IconTrash } from '@tabler/icons-react';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useRef, useState } from 'react';
import { PLACEHOLDER_GROUPS } from '../../_lib/placeholders';
import {
	formatRestrictionValues,
	RESTRICTION_META,
	type Restriction,
	type RestrictionType,
} from '../../_lib/restrictions';
import RestrictionModal from './RestrictionModal';

type LetterTemplate = typeof letterTemplates.$inferInsert;

type Props = {
	onSubmit: (
		values: LetterTemplate
	) => Promise<LetterTemplate | ActionResult<LetterTemplate>>;
	defaultValues?: LetterTemplate;
	title?: string;
};

const schema = createInsertSchema(letterTemplates).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	createdBy: true,
	content: true,
	restrictions: true,
});

const roleOptions = DASHBOARD_ROLES.map((r) => ({
	value: r,
	label: r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

const SALUTATION_OPTIONS = [
	'Dear Sir/Madam,',
	'Dear Sir,',
	'Dear Madam,',
	'Dear Director,',
	'To Whom It May Concern,',
];

export default function TemplateForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [restrictions, setRestrictions] = useState<Restriction[]>(
		(defaultValues?.restrictions as Restriction[]) ?? []
	);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Link,
			Superscript,
			SubScript,
			Highlight,
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
			Placeholder.configure({ placeholder: 'Write template content...' }),
		],
		content: defaultValues?.content || '',
		immediatelyRender: false,
	});

	const usedTypes = restrictions.map((r) => r.type);

	return (
		<Form
			title={title}
			formRef={formRef}
			action={(values) =>
				onSubmit({
					...values,
					content: editor?.getHTML() || '',
					restrictions,
				} as LetterTemplate)
			}
			queryKey={['letter-templates']}
			schema={schema}
			defaultValues={
				{
					name: defaultValues?.name || '',
					subject: defaultValues?.subject || '',
					salutation: defaultValues?.salutation || 'Dear Sir/Madam,',
					signOffName: defaultValues?.signOffName || '',
					signOffTitle: defaultValues?.signOffTitle || '',
					role: defaultValues?.role || null,
				} as Record<string, unknown>
			}
			onSuccess={() => router.push('/registry/letters/templates')}
		>
			{(form) => (
				<Tabs defaultValue='details'>
					<Tabs.List mb='md'>
						<Tabs.Tab value='details'>Letter Details</Tabs.Tab>
						<Tabs.Tab value='restrictions'>
							<Group gap={'xs'}>
								Restrictions
								{restrictions.length > 0 && (
									<Badge size='xs' ml={6} circle>
										{restrictions.length}
									</Badge>
								)}
							</Group>
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='details'>
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
							<TextInput
								label='Template Name'
								placeholder='e.g. Completion Letter'
								withAsterisk
								{...form.getInputProps('name')}
							/>
							<Select
								label='Role Scope'
								placeholder='System-wide (all departments)'
								data={roleOptions}
								clearable
								{...form.getInputProps('role')}
							/>
						</SimpleGrid>

						<Stack mt='md'>
							<TextInput
								label='Subject Line'
								placeholder='e.g. CONFIRMATION OF STUDENTSHIP – {{studentName}}'
								{...form.getInputProps('subject')}
							/>
							<Select
								label='Default Salutation'
								placeholder='Select a salutation'
								data={SALUTATION_OPTIONS}
								searchable
								{...form.getInputProps('salutation')}
							/>
						</Stack>

						<Divider label='Template Content' labelPosition='center' my='md' />

						<RichTextEditor editor={editor}>
							<RichTextEditor.Toolbar sticky stickyOffset={60}>
								<RichTextEditor.ControlsGroup>
									<RichTextEditor.Bold />
									<RichTextEditor.Italic />
									<RichTextEditor.Underline />
									<RichTextEditor.Strikethrough />
									<RichTextEditor.Highlight />
									<RichTextEditor.ClearFormatting />
								</RichTextEditor.ControlsGroup>

								<RichTextEditor.ControlsGroup>
									<RichTextEditor.H1 />
									<RichTextEditor.H2 />
									<RichTextEditor.H3 />
								</RichTextEditor.ControlsGroup>

								<RichTextEditor.ControlsGroup>
									<RichTextEditor.BulletList />
									<RichTextEditor.OrderedList />
								</RichTextEditor.ControlsGroup>

								<RichTextEditor.ControlsGroup>
									<RichTextEditor.Link />
									<RichTextEditor.Unlink />
								</RichTextEditor.ControlsGroup>

								<RichTextEditor.ControlsGroup>
									<RichTextEditor.AlignLeft />
									<RichTextEditor.AlignCenter />
									<RichTextEditor.AlignRight />
									<RichTextEditor.AlignJustify />
								</RichTextEditor.ControlsGroup>

								<RichTextEditor.ControlsGroup>
									<RichTextEditor.Undo />
									<RichTextEditor.Redo />
								</RichTextEditor.ControlsGroup>

								<RichTextEditor.ControlsGroup>
									{editor && <PlaceholderMenu editor={editor} />}
								</RichTextEditor.ControlsGroup>
							</RichTextEditor.Toolbar>
							<RichTextEditor.Content h={300} />
						</RichTextEditor>

						<Fieldset legend='Sign-off' mt='md'>
							<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
								<TextInput
									label='Name'
									placeholder='e.g. MATEBOHO MOOROSI (Mrs.)'
									{...form.getInputProps('signOffName')}
								/>
								<TextInput
									label='Title'
									placeholder='e.g. REGISTRAR'
									{...form.getInputProps('signOffTitle')}
								/>
							</SimpleGrid>
						</Fieldset>
					</Tabs.Panel>

					<Tabs.Panel value='restrictions'>
						<RestrictionsTab
							restrictions={restrictions}
							usedTypes={usedTypes}
							onChange={setRestrictions}
						/>
					</Tabs.Panel>
				</Tabs>
			)}
		</Form>
	);
}

type RestrictionsTabProps = {
	restrictions: Restriction[];
	usedTypes: RestrictionType[];
	onChange: (restrictions: Restriction[]) => void;
};

function RestrictionsTab({
	restrictions,
	usedTypes,
	onChange,
}: RestrictionsTabProps) {
	return (
		<>
			<Group justify='space-between' mb='md'>
				<Text size='sm' c='dimmed'>
					{restrictions.length === 0
						? 'No restrictions — this template is available to all students.'
						: `${restrictions.length} restriction(s) configured.`}
				</Text>
				<RestrictionModal
					usedTypes={usedTypes}
					onSave={(r) => onChange([...restrictions, r])}
				/>
			</Group>
			{restrictions.length > 0 && (
				<Table striped highlightOnHover withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Type</Table.Th>
							<Table.Th>Operator</Table.Th>
							<Table.Th>Values</Table.Th>
							<Table.Th w={120}>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{restrictions.map((r, idx) => (
							<Table.Tr key={`${r.type}-${idx}`}>
								<Table.Td>{RESTRICTION_META[r.type].label}</Table.Td>
								<Table.Td>
									<Badge
										variant='light'
										size='sm'
										color={r.operator === 'include' ? 'green' : 'red'}
									>
										{r.operator === 'include' ? 'Include' : 'Exclude'}
									</Badge>
								</Table.Td>
								<Table.Td>
									<Text size='sm'>{formatRestrictionValues(r)}</Text>
								</Table.Td>
								<Table.Td>
									<Group gap='xs'>
										<RestrictionModal
											initial={r}
											usedTypes={usedTypes}
											onSave={(updated) => {
												const next = [...restrictions];
												next[idx] = updated;
												onChange(next);
											}}
										/>
										<ActionIcon
											variant='subtle'
											color='red'
											size='sm'
											onClick={() =>
												onChange(restrictions.filter((_, i) => i !== idx))
											}
										>
											<IconTrash size={14} />
										</ActionIcon>
									</Group>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</>
	);
}

type PlaceholderMenuProps = {
	editor: NonNullable<ReturnType<typeof useEditor>>;
};

function PlaceholderMenu({ editor }: PlaceholderMenuProps) {
	return (
		<Menu position='bottom-start' withinPortal>
			<Menu.Target>
				<Button
					variant='default'
					size='compact-sm'
					leftSection={<IconTemplate size={16} />}
				>
					Placeholder
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				{PLACEHOLDER_GROUPS.filter((g) => g.group !== 'General').map(
					(group) => (
						<Menu
							key={group.group}
							trigger='hover'
							position='right-start'
							withinPortal
						>
							<Menu.Target>
								<Menu.Item rightSection={<IconChevronRight size={14} />}>
									{group.group}
								</Menu.Item>
							</Menu.Target>
							<Menu.Dropdown>
								{group.items.map((p) => (
									<Menu.Item
										key={p.token}
										onClick={() =>
											editor?.commands.insertContent(`{{${p.token}}}`)
										}
									>
										{p.label}
									</Menu.Item>
								))}
							</Menu.Dropdown>
						</Menu>
					)
				)}
				<Menu.Divider />
				<Menu.Item
					onClick={() => editor?.commands.insertContent('{{currentDate}}')}
				>
					Current Date
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
