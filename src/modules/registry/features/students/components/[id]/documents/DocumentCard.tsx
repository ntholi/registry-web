'use client';

import {
	ActionIcon,
	AspectRatio,
	Badge,
	Box,
	Card,
	Flex,
	Group,
	Image,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core';
import { IconDownload, IconFile, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getDocumentUrl } from '@/modules/registry/features/documents/server/actions';
import { formatDate } from '@/shared/lib/utils/utils';
import documentTypes from './documentTypes';

type DocumentCardProps = {
	id: string;
	fileName: string;
	type: string | null;
	createdAt: Date | null;
	canEdit: boolean;
	onDelete: (id: string, fileName: string) => void;
};

export default function DocumentCard({
	id,
	fileName,
	type,
	createdAt,
	canEdit,
	onDelete,
}: DocumentCardProps) {
	const { data: documentUrl } = useQuery({
		queryKey: ['documentUrl', fileName],
		queryFn: () => getDocumentUrl(fileName),
		staleTime: 1000 * 60 * 3,
	});

	function getFileExtension(fileName: string): string {
		return fileName.split('.').pop()?.toLowerCase() || '';
	}

	function isImage(fileName: string): boolean {
		const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
		return imageExtensions.includes(getFileExtension(fileName));
	}

	function isPDF(fileName: string): boolean {
		return getFileExtension(fileName) === 'pdf';
	}

	function handleDownload() {
		if (documentUrl) {
			window.open(documentUrl, '_blank');
		}
	}

	function renderPreview() {
		if (!documentUrl) {
			return (
				<AspectRatio ratio={16 / 9}>
					<Box
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: 'var(--mantine-color-gray-1)',
						}}
					>
						<IconFile size={48} color='var(--mantine-color-gray-6)' />
					</Box>
				</AspectRatio>
			);
		}

		if (isImage(fileName)) {
			return (
				<AspectRatio ratio={16 / 9}>
					<Image
						src={documentUrl}
						alt={fileName}
						fit='cover'
						style={{ cursor: 'pointer' }}
						onClick={handleDownload}
					/>
				</AspectRatio>
			);
		}

		if (isPDF(fileName)) {
			return (
				<AspectRatio ratio={16 / 9}>
					<Box
						style={{
							position: 'relative',
							overflow: 'hidden',
							cursor: 'pointer',
						}}
						onClick={handleDownload}
					>
						<iframe
							src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
							style={{
								width: '100%',
								height: '100%',
								border: 'none',
								pointerEvents: 'none',
							}}
							title={fileName}
						/>
					</Box>
				</AspectRatio>
			);
		}

		return (
			<AspectRatio ratio={16 / 9}>
				<Box
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: 'var(--mantine-color-gray-1)',
						cursor: 'pointer',
					}}
					onClick={handleDownload}
				>
					<IconFile size={48} color='var(--mantine-color-gray-6)' />
				</Box>
			</AspectRatio>
		);
	}

	const ext = getFileExtension(fileName);

	return (
		<Card shadow='sm' padding='xs' withBorder>
			{renderPreview()}

			<Stack gap='xs' mt='md'>
				<Box>
					<Group justify='space-between' align='flex-start'>
						<Text fw={500} size='sm' lineClamp={2} style={{ flex: 1 }}>
							{documentTypes.find((it) => it.value === type)?.label ||
								'Unknown'}
						</Text>
						<Badge color='gray' variant='light' size='sm'>
							{ext}
						</Badge>
					</Group>

					<Text size='xs' c='dimmed'>
						{formatDate(createdAt)}
					</Text>
				</Box>

				<Flex gap='xs' mt='xs' justify={'space-between'}>
					<Tooltip label='Download'>
						<ActionIcon variant='light' color='blue' onClick={handleDownload}>
							<IconDownload size={16} />
						</ActionIcon>
					</Tooltip>
					{canEdit && (
						<Tooltip label='Delete'>
							<ActionIcon
								variant='light'
								color='red'
								onClick={() => onDelete(id, fileName)}
							>
								<IconTrash size={16} />
							</ActionIcon>
						</Tooltip>
					)}
				</Flex>
			</Stack>
		</Card>
	);
}
