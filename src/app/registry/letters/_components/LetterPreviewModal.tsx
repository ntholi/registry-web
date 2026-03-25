'use client';

import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { resolveTemplate } from '../_lib/resolve';
import type {
	getActiveTemplates,
	getRecipientsByTemplate,
	getStudentForLetter,
} from '../_server/actions';
import LetterPreview from './LetterPreview';

type Template = NonNullable<
	Awaited<ReturnType<typeof getActiveTemplates>>
>[number];
type StudentData = NonNullable<Awaited<ReturnType<typeof getStudentForLetter>>>;
type Recipient = NonNullable<
	Awaited<ReturnType<typeof getRecipientsByTemplate>>
>[number];

type Props = {
	template: Template | null | undefined;
	studentData: StudentData | null | undefined;
	recipient: Recipient | null | undefined;
	salutation: string | null | undefined;
};

export default function LetterPreviewModal({
	template,
	studentData,
	recipient,
	salutation,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	function handleOpen() {
		if (!template || !studentData) return;
		open();
	}

	const content =
		template && studentData
			? resolveTemplate(template.content, studentData)
			: null;

	const subject =
		template?.subject && studentData
			? resolveTemplate(template.subject, studentData)
			: null;

	return (
		<>
			<Button
				variant='light'
				onClick={handleOpen}
				disabled={!template || !studentData}
			>
				Preview
			</Button>

			<Modal
				opened={opened}
				onClose={close}
				title='Letter Preview'
				size='lg'
				centered
			>
				{content && (
					<LetterPreview
						content={content}
						recipient={recipient}
						salutation={salutation}
						subject={subject}
						signOffName={template?.signOffName}
						signOffTitle={template?.signOffTitle}
					/>
				)}
			</Modal>
		</>
	);
}
