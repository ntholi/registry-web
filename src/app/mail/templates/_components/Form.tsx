'use client';

import { Select, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import '@mantine/tiptap/styles.css';
import { mailTemplates } from '@mail/_database';
import { mailTriggers } from '@mail/_lib/triggers';
import { Link } from '@mantine/tiptap';
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
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { Form, PlaceholderMenu } from '@/shared/ui/adease';
import { PLACEHOLDER_GROUPS } from '../_lib/placeholders';

type MailTemplate = typeof mailTemplates.$inferInsert;

type Props = {
	onSubmit: (
		values: MailTemplate
	) => Promise<MailTemplate | ActionResult<MailTemplate>>;
	defaultValues?: MailTemplate;
	title?: string;
};

const schema = createInsertSchema(mailTemplates).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	createdBy: true,
	body: true,
});

const triggerOptions = mailTriggers.map((t) => ({
	value: t.type,
	label: t.label,
}));

export default function MailTemplateForm({
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
			Placeholder.configure({ placeholder: 'Write email template body...' }),
		],
		content: defaultValues?.body || '',
		immediatelyRender: false,
	});

	return (
		<Form
			title={title}
			formRef={formRef}
			action={(values) =>
				onSubmit({
					...values,
					body: editor?.getHTML() || '',
				} as MailTemplate)
			}
			queryKey={['mail-templates']}
			schema={schema}
			defaultValues={
				{
					name: defaultValues?.name || '',
					triggerType: defaultValues?.triggerType || null,
					subject: defaultValues?.subject || '',
					isActive: defaultValues?.isActive ?? true,
				} as Record<string, unknown>
			}
			onSuccess={() => router.push('/mail/templates')}
		>
			{(form) => (
				<Stack>
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
						<TextInput
							label='Template Name'
							placeholder='e.g. Student Status Approved'
							withAsterisk
							{...form.getInputProps('name')}
						/>
						<Select
							label='Trigger Type'
							placeholder='Select trigger type'
							data={triggerOptions}
							withAsterisk
							searchable
							{...form.getInputProps('triggerType')}
						/>
					</SimpleGrid>

					<TextInput
						label='Subject Line'
						placeholder='e.g. Status Request {{statusType}} — {{studentName}}'
						withAsterisk
						{...form.getInputProps('subject')}
					/>

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
								{editor && (
									<PlaceholderMenu
										editor={editor}
										groups={PLACEHOLDER_GROUPS}
									/>
								)}
							</RichTextEditor.ControlsGroup>
						</RichTextEditor.Toolbar>
						<RichTextEditor.Content h={300} />
					</RichTextEditor>
				</Stack>
			)}
		</Form>
	);
}
