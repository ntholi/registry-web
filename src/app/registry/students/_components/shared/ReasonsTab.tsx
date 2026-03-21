'use client';

import {
	ActionIcon,
	Button,
	Divider,
	FileButton,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { IconFile, IconPaperclip, IconX } from '@tabler/icons-react';
import { formatFileSize } from '@/shared/lib/utils/files';
import RichTextField from '@/shared/ui/adease/RichTextField';

const ACCEPTED_FILE_TYPES =
	'application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type ReasonsTabProps = {
	reasons: string;
	onReasonsChange: (value: string) => void;
	pendingFiles: File[];
	onAddFile: (file: File | null) => void;
	onRemoveFile: (index: number) => void;
};

export default function ReasonsTab({
	reasons,
	onReasonsChange,
	pendingFiles,
	onAddFile,
	onRemoveFile,
}: ReasonsTabProps) {
	return (
		<Stack gap='md'>
			<RichTextField
				label='Reasons for Update'
				toolbar='mini'
				placeholder='Enter the reason for this update (optional)'
				value={reasons}
				onChange={onReasonsChange}
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
					<FileButton onChange={onAddFile} accept={ACCEPTED_FILE_TYPES}>
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
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						{pendingFiles.map((file, i) => (
							<Paper
								key={`${file.name}-${file.size}-${file.lastModified}`}
								p='xs'
								withBorder
							>
								<Group justify='space-between' wrap='nowrap'>
									<Group gap='xs' wrap='nowrap' style={{ overflow: 'hidden' }}>
										<IconFile
											size={14}
											style={{
												color: 'var(--mantine-color-dimmed)',
												flexShrink: 0,
											}}
										/>
										<Stack gap={0} style={{ overflow: 'hidden' }}>
											<Text size='xs' truncate>
												{file.name}
											</Text>
											<Text size='xs' c='dimmed'>
												{formatFileSize(file.size)}
											</Text>
										</Stack>
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
					</SimpleGrid>
				)}
			</Stack>
		</Stack>
	);
}
