'use client';

import {
	Button,
	Divider,
	Fieldset,
	Menu,
	MultiSelect,
	Select,
	SimpleGrid,
	TextInput,
} from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { letterTemplates } from '@registry/_database';
import { studentStatus } from '@registry/students/_schema/students';
import {
	programStatus,
	semesterStatus,
} from '@registry/students/_schema/types';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { Form } from '@/shared/ui/adease';
import '@mantine/tiptap/styles.css';
import { Link } from '@mantine/tiptap';
import { IconChevronRight, IconTemplate } from '@tabler/icons-react';
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
import { useRef } from 'react';
import { PLACEHOLDER_GROUPS } from '../../_lib/placeholders';

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

	return (
		<Form
			title={title}
			formRef={formRef}
			action={(values) => {
				const v = values as Record<string, string[] | string | null>;
				return onSubmit({
					...values,
					content: editor?.getHTML() || '',
					allowedSemesterStatuses: (v.allowedSemesterStatuses as string[])
						?.length
						? v.allowedSemesterStatuses
						: null,
					allowedStudentStatuses: (v.allowedStudentStatuses as string[])?.length
						? v.allowedStudentStatuses
						: null,
					allowedProgramStatuses: (v.allowedProgramStatuses as string[])?.length
						? v.allowedProgramStatuses
						: null,
				} as LetterTemplate);
			}}
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
					allowedSemesterStatuses:
						(defaultValues?.allowedSemesterStatuses as string[]) ?? [],
					allowedStudentStatuses:
						(defaultValues?.allowedStudentStatuses as string[]) ?? [],
					allowedProgramStatuses:
						(defaultValues?.allowedProgramStatuses as string[]) ?? [],
				} as Record<string, unknown>
			}
			onSuccess={() => router.push('/registry/letters/templates')}
		>
			{(form) => (
				<>
					<Fieldset legend='Basic Info' variant='filled'>
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
					</Fieldset>

					<Fieldset legend='Letter Header' variant='filled'>
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
							<TextInput
								label='Subject Line'
								placeholder='e.g. CONFIRMATION OF STUDENTSHIP – {{studentName}}'
								description='Supports {{placeholders}}'
								{...form.getInputProps('subject')}
							/>
							<Select
								label='Default Salutation'
								placeholder='Select a salutation'
								data={SALUTATION_OPTIONS}
								searchable
								{...form.getInputProps('salutation')}
							/>
						</SimpleGrid>
					</Fieldset>

					<Divider label='Template Content' labelPosition='center' />

					<RichTextEditor editor={editor} mih={300}>
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
						<RichTextEditor.Content />
					</RichTextEditor>

					<Fieldset legend='Eligibility Restrictions' variant='filled'>
						<SimpleGrid cols={{ base: 1, sm: 3 }} spacing='md'>
							<MultiSelect
								label='Semester Statuses'
								placeholder='Any (no restriction)'
								data={semesterStatus.enumValues}
								{...form.getInputProps('allowedSemesterStatuses')}
							/>
							<MultiSelect
								label='Student Statuses'
								placeholder='Any (no restriction)'
								data={studentStatus.enumValues}
								{...form.getInputProps('allowedStudentStatuses')}
							/>
							<MultiSelect
								label='Program Statuses'
								placeholder='Any (no restriction)'
								data={programStatus.enumValues}
								{...form.getInputProps('allowedProgramStatuses')}
							/>
						</SimpleGrid>
					</Fieldset>

					<Fieldset legend='Sign-off' variant='filled'>
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
				</>
			)}
		</Form>
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
