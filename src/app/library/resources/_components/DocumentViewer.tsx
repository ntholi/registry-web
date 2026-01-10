'use client';

import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconDownload, IconExternalLink } from '@tabler/icons-react';
import Image from 'next/image';
import { getResourceUrl } from '../_lib/url';

type Props = {
	fileName: string;
	originalName: string;
	mimeType: string;
	isDownloadable: boolean;
};

export default function DocumentViewer({
	fileName,
	originalName,
	mimeType,
	isDownloadable,
}: Props) {
	const url = getResourceUrl(fileName);
	const isPdf = mimeType === 'application/pdf';
	const isImage = mimeType.startsWith('image/');

	if (isPdf) {
		return (
			<Stack gap='sm'>
				<iframe
					src={url}
					width='100%'
					height='500px'
					style={{ border: 'none', borderRadius: 'var(--mantine-radius-md)' }}
					title={originalName}
				/>
				{isDownloadable && (
					<Group justify='flex-end'>
						<Button
							component='a'
							href={url}
							download={originalName}
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
					src={url}
					alt={originalName}
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
							href={url}
							download={originalName}
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
				<Text fw={500}>{originalName}</Text>
				<Text size='sm' c='dimmed'>
					{mimeType}
				</Text>
				<Group>
					<Button
						component='a'
						href={url}
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
							href={url}
							download={originalName}
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
