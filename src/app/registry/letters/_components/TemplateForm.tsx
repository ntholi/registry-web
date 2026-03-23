'use client';

import { Button, Group, Menu, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { RichTextEditor } from '@mantine/tiptap';
import { letterTemplates } from '@registry/_database';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import {
	getActionErrorMessage,
	isActionResult,
} from '@/shared/lib/actions/actionResult';
import '@mantine/tiptap/styles.css';
import { Link } from '@mantine/tiptap';
import { IconDeviceFloppy, IconTemplate } from '@tabler/icons-react';
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
import { PLACEHOLDERS } from '../_lib/placeholders';

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
			role: defaultValues?.role || null,
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
				<Select
					label='Role Scope'
					placeholder='System-wide (all departments)'
					data={roleOptions}
					clearable
					{...form.getInputProps('role')}
				/>
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
									{PLACEHOLDERS.map((p) => (
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
						</RichTextEditor.ControlsGroup>
					</RichTextEditor.Toolbar>
					<RichTextEditor.Content />
				</RichTextEditor>

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
