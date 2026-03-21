'use client';

import {
	ActionIcon,
	Button,
	Divider,
	FileButton,
	Group,
	Paper,
	Stack,
	Text,
} from '@mantine/core';
import {
	createStudentNote,
	uploadNoteAttachment,
} from '@registry/student-notes';
import { IconFile, IconPaperclip, IconX } from '@tabler/icons-react';
import RichTextField from '@/shared/ui/adease/RichTextField';

type Props = {
	value: string;
	onChange: (value: string) => void;
	pendingFiles: File[];
	onAddFile: (file: File | null) => void;
	onRemoveFile: (index: number) => void;
};

export default function ReasonsAndAttachments({
	value,
	onChange,
	pendingFiles,
	onAddFile,
	onRemoveFile,
}: Props) {
	return (
		<Stack gap='md'>
			<RichTextField
				toolbar='mini'
				placeholder='Enter the reason for this update (optional)'
				value={value}
				onChange={onChange}
				height={200}
				showFullScreenButton={false}
			/>
			<Stack gap='xs'>
				<Divider
					label={
						<Text size='xs' c='dimmed'>
							Attachments
						</Text>
					}
					labelPosition='left'
				/>
				<Group gap='xs' align='center'>
					<FileButton
						onChange={onAddFile}
						accept='application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
					>
						{(props) => (
							<Button
								{...props}
								variant='default'
								size='xs'
								leftSection={<IconPaperclip size={12} />}
							>
								Add Attachment
							</Button>
						)}
					</FileButton>
					{pendingFiles.length === 0 && (
						<Text size='xs' c='dimmed'>
							No attachments yet
						</Text>
					)}
				</Group>
				{pendingFiles.length > 0 && (
					<Stack gap={4}>
						{pendingFiles.map((file, i) => (
							<Paper key={`${file.name}-${i}`} px='xs' py={6} withBorder>
								<Group justify='space-between'>
									<Group gap='xs'>
										<IconFile
											size={14}
											style={{ color: 'var(--mantine-color-dimmed)' }}
										/>
										<Text size='xs'>{file.name}</Text>
									</Group>
									<ActionIcon
										size='xs'
										variant='subtle'
										color='red'
										onClick={() => onRemoveFile(i)}
									>
										<IconX size={12} />
									</ActionIcon>
								</Group>
							</Paper>
						))}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
}

export function isReasonsEmpty(value: string): boolean {
	return !value.trim() || value === '<p></p>';
}

export async function uploadEditAttachments(
	stdNo: number,
	content: string,
	files: File[]
) {
	if (files.length === 0) return;
	const noteResult = await createStudentNote(stdNo, content, 'role');
	if (noteResult.success) {
		for (const file of files) {
			const formData = new FormData();
			formData.append('file', file);
			await uploadNoteAttachment(stdNo, noteResult.data.id, formData);
		}
	}
}
