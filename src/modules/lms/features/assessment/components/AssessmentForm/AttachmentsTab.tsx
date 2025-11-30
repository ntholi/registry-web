'use client';

import {
	ActionIcon,
	Button,
	Divider,
	FileButton,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { IconTrash, IconUpload } from '@tabler/icons-react';

type FormValues = {
	assessmentNumber: string;
	assessmentType: string;
	totalMarks: number;
	weight: number;
	availableFrom: string | null;
	dueDate: string | null;
	description?: string;
	instructions?: string;
	attachments?: File[];
};

type AttachmentsTabProps = {
	form: UseFormReturnType<FormValues>;
};

export default function AttachmentsTab({ form }: AttachmentsTabProps) {
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
		<Stack mih={300}>
			<FileButton onChange={handleFilesSelect} multiple>
				{(props) => (
					<Button
						variant='default'
						leftSection={<IconUpload size={16} />}
						{...props}
					>
						Upload Files
					</Button>
				)}
			</FileButton>

			<Divider />

			{form.values.attachments && form.values.attachments.length > 0 && (
				<Grid>
					{form.values.attachments.map((file, index) => (
						<Grid.Col key={`${file.name}-${index}`} span={6}>
							<Paper withBorder p='sm'>
								<Group justify='space-between' wrap='nowrap'>
									<Text size='sm' truncate style={{ flex: 1 }}>
										{file.name}
									</Text>
									<ActionIcon
										variant='subtle'
										color='red'
										onClick={() => handleFileRemove(index)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								</Group>
								<Text size='xs' c='dimmed'>
									{(file.size / 1024).toFixed(1)} KB
								</Text>
							</Paper>
						</Grid.Col>
					))}
				</Grid>
			)}
		</Stack>
	);
}
