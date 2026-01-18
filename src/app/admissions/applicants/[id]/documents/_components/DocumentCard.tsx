'use client';

import {
	ActionIcon,
	AspectRatio,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Image,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconDownload,
	IconFile,
	IconSparkles,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { getDocumentVerificationStatusColor } from '@/shared/lib/utils/colors';
import type { ApplicantDocument } from '../_lib/types';
import {
	deleteApplicantDocument,
	reanalyzeDocumentFromUrl,
} from '../_server/actions';
import { ReviewModal } from './ReviewModal';

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
	onPreview: (url: string) => void;
	onReanalyze?: (fileUrl: string) => void;
};

export function DocumentCard({ doc, onPreview, onReanalyze }: Props) {
	const router = useRouter();

	const fileUrl = doc.document.fileUrl ?? '';
	const isPdf = isPdfFile(doc.document.fileName);
	const isImage = isImageFile(doc.document.fileName);

	const deleteMutation = useMutation({
		mutationFn: async () => {
			await deleteApplicantDocument(doc.id, fileUrl);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Document deleted',
				color: 'green',
			});
			router.refresh();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to delete document',
				color: 'red',
			});
		},
	});

	const reanalyzeMutation = useMutation({
		mutationFn: async () => {
			if (!doc.document.type) {
				throw new Error('Document type is required');
			}
			await reanalyzeDocumentFromUrl(
				fileUrl,
				doc.applicantId,
				doc.document.type
			);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Document re-analyzed and data saved',
				color: 'green',
			});
			onReanalyze?.(fileUrl);
			router.refresh();
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to re-analyze document',
				color: 'red',
			});
		},
	});

	function handleDownload() {
		window.open(fileUrl, '_blank');
	}

	return (
		<Card withBorder padding='xs'>
			<AspectRatio ratio={16 / 9}>
				{isPdf ? (
					<Box
						style={{
							position: 'relative',
							overflow: 'hidden',
							cursor: 'pointer',
						}}
						onClick={() => onPreview(fileUrl)}
					>
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
					<Box style={{ cursor: 'pointer' }} onClick={() => onPreview(fileUrl)}>
						<Image
							src={fileUrl}
							alt={doc.document.fileName ?? 'Document'}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							}}
						/>
					</Box>
				) : (
					<Box
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: 'var(--mantine-color-dark-6)',
							cursor: 'pointer',
						}}
						onClick={handleDownload}
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

				<Group justify='space-between'>
					<Group gap='xs'>
						<Tooltip label='Download'>
							<ActionIcon variant='light' onClick={handleDownload}>
								<IconDownload size={16} />
							</ActionIcon>
						</Tooltip>
						<Tooltip label='Re-analyze with AI'>
							<ActionIcon
								variant='light'
								color='violet'
								onClick={() => reanalyzeMutation.mutate()}
								loading={reanalyzeMutation.isPending}
							>
								<IconSparkles size={16} />
							</ActionIcon>
						</Tooltip>
						<ReviewModal
							docId={doc.id}
							initialStatus={doc.verificationStatus}
							initialReason={doc.rejectionReason}
						>
							{(open) => (
								<Button size='compact-xs' variant='light' onClick={open}>
									Review
								</Button>
							)}
						</ReviewModal>
					</Group>
					<Tooltip label='Delete'>
						<ActionIcon
							variant='light'
							color='red'
							onClick={() => deleteMutation.mutate()}
							loading={deleteMutation.isPending}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Stack>
		</Card>
	);
}
