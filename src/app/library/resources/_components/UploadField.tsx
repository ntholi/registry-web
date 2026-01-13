'use client';

import { Group, rem, Stack, Text } from '@mantine/core';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { IconFile, IconUpload, IconX } from '@tabler/icons-react';
import { MAX_FILE_SIZE } from '../_lib/types';

type Props = {
	value: FileWithPath | null;
	onChange: (file: FileWithPath | null) => void;
	currentFileName?: string;
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
}: Props) {
	return (
		<Stack gap='xs'>
			<Dropzone
				onDrop={(files) => onChange(files[0] || null)}
				onReject={() => onChange(null)}
				maxSize={MAX_FILE_SIZE}
				multiple={false}
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

			{value && (
				<Group gap='xs'>
					<IconFile size={16} />
					<Text size='sm'>
						{value.name} ({formatFileSize(value.size)})
					</Text>
				</Group>
			)}

			{!value && currentFileName && (
				<Text size='sm' c='dimmed'>
					Current file: {currentFileName}
				</Text>
			)}
		</Stack>
	);
}
