'use client';

import {
	ActionIcon,
	Badge,
	Card,
	Group,
	rem,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { IconFile, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { MAX_FILE_SIZE } from '../_lib/types';

type Props = {
	value: FileWithPath | null;
	onChange: (file: FileWithPath | null) => void;
	currentFileName?: string;
	loading?: boolean;
};

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadField({
	value,
	onChange,
	currentFileName,
	loading,
}: Props) {
	return (
		<Stack gap='xs'>
			<Dropzone
				onDrop={(files) => onChange(files[0] || null)}
				onReject={() => onChange(null)}
				maxSize={MAX_FILE_SIZE}
				multiple={false}
				loading={loading}
			>
				<Group
					justify='center'
					gap='xl'
					mih={120}
					style={{ pointerEvents: 'none' }}
				>
					<Dropzone.Accept>
						<IconUpload
							style={{
								width: rem(52),
								height: rem(52),
								color: 'var(--mantine-color-blue-6)',
							}}
							stroke={1.5}
						/>
					</Dropzone.Accept>
					<Dropzone.Reject>
						<IconX
							style={{
								width: rem(52),
								height: rem(52),
								color: 'var(--mantine-color-red-6)',
							}}
							stroke={1.5}
						/>
					</Dropzone.Reject>
					<Dropzone.Idle>
						<IconFile
							style={{
								width: rem(52),
								height: rem(52),
								color: 'var(--mantine-color-dimmed)',
							}}
							stroke={1.5}
						/>
					</Dropzone.Idle>

					<div>
						<Text size='xl' inline>
							Drag file here or click to select
						</Text>
						<Text size='sm' c='dimmed' inline mt={7}>
							File should not exceed 10MB
						</Text>
					</div>
				</Group>
			</Dropzone>

			{(value || currentFileName) && (
				<Card withBorder p='md' radius='md'>
					<Group justify='space-between' wrap='nowrap'>
						<Group gap='sm' wrap='nowrap' style={{ flex: 1 }}>
							<ThemeIcon size={40} radius='md' variant='light' color='blue'>
								<IconFile size={24} />
							</ThemeIcon>
							<div style={{ flex: 1, minWidth: 0 }}>
								<Text size='sm' fw={600} truncate>
									{value?.name || currentFileName}
								</Text>
								<Group gap={4}>
									{value ? (
										<Text size='xs' c='dimmed'>
											{formatFileSize(value.size)}
										</Text>
									) : (
										<Badge size='xs' variant='outline' color='blue'>
											Existing File
										</Badge>
									)}
								</Group>
							</div>
						</Group>
						<Tooltip label='Remove file'>
							<ActionIcon
								variant='subtle'
								color='red'
								onClick={() => onChange(null)}
								disabled={loading}
								size='lg'
							>
								<IconTrash size={20} />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Card>
			)}
		</Stack>
	);
}
