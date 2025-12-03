'use client';

import {
	ActionIcon,
	FileButton,
	Group,
	Paper,
	Stack,
	Text,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { IconPaperclip, IconTrash, IconUpload } from '@tabler/icons-react';
import type { FormValues } from './index';

type AttachmentsSectionProps = {
	form: UseFormReturnType<FormValues>;
};

export default function AttachmentsSection({ form }: AttachmentsSectionProps) {
	function handleFilesSelect(files: File[]) {
		const currentFiles = form.values.attachments || [];
		form.setFieldValue('attachments', [...currentFiles, ...files]);
	}

	function handleFileRemove(index: number) {
		const currentFiles = form.values.attachments || [];
		form.setFieldValue(
			'attachments',
			currentFiles.filter((_, i) => i !== index)
		);
	}

	return (
		<Stack gap='xs'>
			<Group gap='xs'>
				<IconPaperclip size={16} />
				<Text size='sm' fw={500}>
					Attachments
				</Text>
			</Group>

			<FileButton onChange={handleFilesSelect} multiple>
				{(props) => (
					<Paper withBorder p='md' style={{ cursor: 'pointer' }} {...props}>
						<Group justify='center' gap='xs'>
							<IconUpload size={18} />
							<Text size='sm'>Click to upload files</Text>
						</Group>
					</Paper>
				)}
			</FileButton>

			{form.values.attachments && form.values.attachments.length > 0 && (
				<Stack gap='xs'>
					{form.values.attachments.map((file, index) => (
						<Paper key={`${file.name}-${index}`} withBorder p='xs'>
							<Group justify='space-between' wrap='nowrap'>
								<Group gap='xs' style={{ flex: 1, minWidth: 0 }}>
									<IconPaperclip size={14} />
									<Text size='sm' truncate style={{ flex: 1 }}>
										{file.name}
									</Text>
									<Text size='xs' c='dimmed'>
										{(file.size / 1024).toFixed(1)} KB
									</Text>
								</Group>
								<ActionIcon
									variant='subtle'
									color='red'
									size='sm'
									onClick={() => handleFileRemove(index)}
								>
									<IconTrash size={14} />
								</ActionIcon>
							</Group>
						</Paper>
					))}
				</Stack>
			)}
		</Stack>
	);
}
