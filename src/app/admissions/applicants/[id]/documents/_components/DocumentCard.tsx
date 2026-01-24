'use client';

import {
	AspectRatio,
	Badge,
	Box,
	Card,
	Group,
	Image,
	Stack,
	Text,
} from '@mantine/core';
import { IconFile } from '@tabler/icons-react';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
import type { ApplicantDocument } from '../_lib/types';

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
	doc: ApplicantDocument;
	onPreview: () => void;
};

export function DocumentCard({ doc, onPreview }: Props) {
	const fileUrl = doc.document.fileUrl ?? '';
	const isPdf = isPdfFile(doc.document.fileName);
	const isImage = isImageFile(doc.document.fileName);

	return (
		<Card
			withBorder
			padding='xs'
			style={{ cursor: 'pointer' }}
			onClick={onPreview}
		>
			<AspectRatio ratio={16 / 9}>
				{isPdf ? (
					<Box style={{ position: 'relative', overflow: 'hidden' }}>
						<iframe
							src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
							style={{
								width: '100%',
								height: '100%',
								border: 'none',
								pointerEvents: 'none',
							}}
							title={doc.document.fileName ?? 'PDF'}
						/>
					</Box>
				) : isImage ? (
					<Image
						src={fileUrl}
						alt={doc.document.fileName ?? 'Document'}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
				) : (
					<Box
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: 'var(--mantine-color-dark-6)',
						}}
					>
						<IconFile size={48} color='var(--mantine-color-gray-6)' />
					</Box>
				)}
			</AspectRatio>

			<Stack gap='xs' mt='xs'>
				<Group justify='space-between' wrap='nowrap'>
					<Text size='sm' fw={500} lineClamp={1} style={{ flex: 1 }}>
						{doc.document.fileName}
					</Text>
					<Badge
						size='xs'
						color={getDocumentVerificationStatusColor(doc.verificationStatus)}
					>
						{doc.verificationStatus}
					</Badge>
				</Group>

				{doc.verificationStatus === 'rejected' && doc.rejectionReason && (
					<Text size='xs' c='red' lineClamp={2}>
						{doc.rejectionReason}
					</Text>
				)}
			</Stack>
		</Card>
	);
}
