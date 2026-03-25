'use client';

import {
	Button,
	Group,
	Menu,
	MultiSelect,
	Select,
	SimpleGrid,
	Stack,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { RichTextEditor } from '@mantine/tiptap';
import { letterTemplates } from '@registry/_database';
import { studentStatus } from '@registry/students/_schema/students';
import {
	programStatus,
	semesterStatus,
} from '@registry/students/_schema/types';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import {
	getActionErrorMessage,
	isActionResult,
} from '@/shared/lib/actions/actionResult';
import '@mantine/tiptap/styles.css';
import { Link } from '@mantine/tiptap';
import {
	IconChevronRight,
	IconDeviceFloppy,
	IconTemplate,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { createInsertSchema } from 'drizzle-zod';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { PLACEHOLDER_GROUPS } from '../_lib/placeholders';

type LetterTemplate = typeof letterTemplates.$inferInsert;

type Props = {
	onSubmit: (
		values: LetterTemplate
	) => Promise<LetterTemplate | ActionResult<LetterTemplate>>;
	defaultValues?: LetterTemplate;
	onClose?: () => void;
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
	onClose,
}: Props) {
	const queryClient = useQueryClient();

	const form = useForm({
		validate: zodResolver(schema),
		initialValues: {
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
		},
	});

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

	const mutation = useMutation({
		mutationFn: (values: typeof form.values) =>
			onSubmit({
				...values,
				content: editor?.getHTML() || '',
				allowedSemesterStatuses: values.allowedSemesterStatuses.length
					? values.allowedSemesterStatuses
					: null,
				allowedStudentStatuses: values.allowedStudentStatuses.length
					? values.allowedStudentStatuses
					: null,
				allowedProgramStatuses: values.allowedProgramStatuses.length
					? values.allowedProgramStatuses
					: null,
			} as LetterTemplate),
		onSuccess: async (data) => {
			if (isActionResult(data)) {
				if (!data.success) {
					notifications.show({
						title: 'Error',
						message: getActionErrorMessage(data.error),
						color: 'red',
					});
					return;
				}
			}
			await queryClient.invalidateQueries({
				queryKey: ['letter-templates'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: 'Template saved',
				color: 'green',
			});
			onClose?.();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'An unexpected error occurred',
				color: 'red',
			});
		},
	});

	return (
		<form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
			<Stack gap='md'>
				<TextInput
					label='Template Name'
					placeholder='e.g. Completion Letter'
					{...form.getInputProps('name')}
				/>
				<TextInput
					label='Subject Line'
					placeholder='e.g. CONFIRMATION OF STUDENTSHIP – {{studentName}}'
					description='Supports placeholders like {{studentName}}'
					{...form.getInputProps('subject')}
				/>
				<Select
					label='Default Salutation'
					placeholder='Select a salutation'
					data={SALUTATION_OPTIONS}
					searchable
					{...form.getInputProps('salutation')}
				/>
				<Select
					label='Role Scope'
					placeholder='System-wide (all departments)'
					data={roleOptions}
					clearable
					{...form.getInputProps('role')}
				/>
				<SimpleGrid cols={3}>
					<MultiSelect
						label='Allowed Semester Statuses'
						placeholder='Any (no restriction)'
						data={semesterStatus.enumValues}
						{...form.getInputProps('allowedSemesterStatuses')}
					/>
					<MultiSelect
						label='Allowed Student Statuses'
						placeholder='Any (no restriction)'
						data={studentStatus.enumValues}
						{...form.getInputProps('allowedStudentStatuses')}
					/>
					<MultiSelect
						label='Allowed Program Statuses'
						placeholder='Any (no restriction)'
						data={programStatus.enumValues}
						{...form.getInputProps('allowedProgramStatuses')}
					/>
				</SimpleGrid>
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
													<Menu.Item
														rightSection={<IconChevronRight size={14} />}
													>
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
										onClick={() =>
											editor?.commands.insertContent('{{currentDate}}')
										}
									>
										Current Date
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</RichTextEditor.ControlsGroup>
					</RichTextEditor.Toolbar>
					<RichTextEditor.Content />
				</RichTextEditor>

				<SimpleGrid cols={2}>
					<TextInput
						label='Sign-off Name'
						placeholder="e.g. 'MATEBOHO MOOROSI (Mrs.)"
						{...form.getInputProps('signOffName')}
					/>
					<TextInput
						label='Sign-off Title'
						placeholder='e.g. REGISTRAR'
						{...form.getInputProps('signOffTitle')}
					/>
				</SimpleGrid>

				<Group justify='flex-end' mt='sm'>
					{onClose && (
						<Button variant='default' onClick={onClose}>
							Cancel
						</Button>
					)}
					<Button
						type='submit'
						loading={mutation.isPending}
						leftSection={<IconDeviceFloppy size={16} />}
					>
						Save
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
