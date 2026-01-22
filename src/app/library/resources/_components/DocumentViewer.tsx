'use client';

import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconDownload, IconExternalLink } from '@tabler/icons-react';
import Image from 'next/image';

type Props = {
	fileUrl: string;
	fileName: string;
	isDownloadable: boolean;
};

export default function DocumentViewer({
	fileUrl,
	fileName,
	isDownloadable,
}: Props) {
	const ext = fileName.split('.').pop()?.toLowerCase() || '';
	const isPdf = ext === 'pdf';
	const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

	if (isPdf) {
		return (
			<Stack gap='sm'>
				<iframe
					src={fileUrl}
					width='100%'
					height='500px'
					style={{ border: 'none', borderRadius: 'var(--mantine-radius-md)' }}
					title={fileName}
				/>
				{isDownloadable && (
					<Group justify='flex-end'>
						<Button
							component='a'
							href={fileUrl}
							download={fileName}
							leftSection={<IconDownload size={16} />}
							variant='light'
						>
							Download
						</Button>
					</Group>
				)}
			</Stack>
		);
	}

	if (isImage) {
		return (
			<Stack gap='sm'>
				<Image
					src={fileUrl}
					alt={fileName}
					width={800}
					height={500}
					style={{
						maxWidth: '100%',
						height: 'auto',
						borderRadius: 'var(--mantine-radius-md)',
						objectFit: 'contain',
					}}
				/>
				{isDownloadable && (
					<Group justify='flex-end'>
						<Button
							component='a'
							href={fileUrl}
							download={fileName}
							leftSection={<IconDownload size={16} />}
							variant='light'
						>
							Download
						</Button>
					</Group>
				)}
			</Stack>
		);
	}

	return (
		<Card withBorder p='md'>
			<Stack gap='sm' align='center'>
				<Text fw={500}>{fileName}</Text>
				<Group>
					<Button
						component='a'
						href={fileUrl}
						target='_blank'
						rel='noopener noreferrer'
						leftSection={<IconExternalLink size={16} />}
						variant='light'
					>
						Open
					</Button>
					{isDownloadable && (
						<Button
							component='a'
							href={fileUrl}
							download={fileName}
							leftSection={<IconDownload size={16} />}
							variant='light'
						>
							Download
						</Button>
					)}
				</Group>
			</Stack>
		</Card>
	);
}
