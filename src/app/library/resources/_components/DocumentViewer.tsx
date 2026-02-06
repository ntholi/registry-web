'use client';

import { Box, Button, Card, Group, Image, Stack, Text } from '@mantine/core';
import { IconDownload, IconExternalLink, IconFile } from '@tabler/icons-react';

function isImageFile(fileName: string | null | undefined): boolean {
	if (!fileName) return false;
	const ext = fileName.toLowerCase().split('.').pop();
	return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
}

function isPdfFile(fileName: string | null | undefined): boolean {
	if (!fileName) return false;
	return fileName.toLowerCase().endsWith('.pdf');
}

type Props = {
	fileUrl: string;
	fileName: string;
};

export default function DocumentViewer({ fileUrl, fileName }: Props) {
	const isPdf = isPdfFile(fileName);
	const isImage = isImageFile(fileName);

	function handleDownload() {
		window.open(fileUrl, '_blank');
	}

	if (isPdf) {
		return (
			<Stack gap='sm'>
				<Box
					style={{
						position: 'relative',
						overflow: 'hidden',
						borderRadius: 'var(--mantine-radius-md)',
					}}
				>
					<iframe
						src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
						style={{
							width: '100%',
							height: '500px',
							border: 'none',
						}}
						title={fileName}
					/>
				</Box>
				<Group justify='flex-end'>
					<Button
						onClick={handleDownload}
						leftSection={<IconDownload size={16} />}
						variant='light'
					>
						Download
					</Button>
				</Group>
			</Stack>
		);
	}

	if (isImage) {
		return (
			<Stack gap='sm'>
				<Image
					src={fileUrl}
					alt={fileName}
					style={{
						maxWidth: '100%',
						height: 'auto',
						borderRadius: 'var(--mantine-radius-md)',
						objectFit: 'contain',
					}}
				/>
				<Group justify='flex-end'>
					<Button
						onClick={handleDownload}
						leftSection={<IconDownload size={16} />}
						variant='light'
					>
						Download
					</Button>
				</Group>
			</Stack>
		);
	}

	return (
		<Card withBorder p='md'>
			<Stack gap='sm' align='center'>
				<Box
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 'var(--mantine-spacing-xl)',
						backgroundColor: 'var(--mantine-color-dark-6)',
						borderRadius: 'var(--mantine-radius-md)',
					}}
				>
					<IconFile size={48} color='var(--mantine-color-gray-6)' />
				</Box>
				<Text fw={500}>{fileName}</Text>
				<Group>
					<Button
						onClick={() => window.open(fileUrl, '_blank')}
						leftSection={<IconExternalLink size={16} />}
						variant='light'
					>
						Open
					</Button>
					<Button
						onClick={handleDownload}
						leftSection={<IconDownload size={16} />}
						variant='light'
					>
						Download
					</Button>
				</Group>
			</Stack>
		</Card>
	);
}
