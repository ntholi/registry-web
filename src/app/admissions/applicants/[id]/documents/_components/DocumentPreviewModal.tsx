'use client';

import DocumentViewer from '@admissions/documents/_components/DocumentViewer';
import {
	ActionIcon,
	Box,
	Divider,
	Group,
	Modal,
	Paper,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { IconCalendar, IconDownload, IconFile } from '@tabler/icons-react';
import { formatDate } from '@/shared/lib/utils/dates';
import type { ApplicantDocument } from '../_lib/types';

type Props = {
	opened: boolean;
	onClose: () => void;
	applicantDoc: ApplicantDocument | null;
};

function formatType(type: string | null | undefined): string {
	if (!type) return 'Unknown';
	return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function DocumentPreviewModal({ opened, onClose, applicantDoc }: Props) {
	if (!applicantDoc) return null;

	const doc = applicantDoc.document;
	const previewUrl = doc.fileUrl ?? '';
	const isPdf = previewUrl.toLowerCase().endsWith('.pdf');

	function handleDownload() {
		window.open(previewUrl, '_blank');
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Document Preview'
			size='xl'
			centered
		>
			<Box>
				<Box>
					<Paper
						p='sm'
						pos='sticky'
						top={0}
						style={{ zIndex: 10, background: 'var(--mantine-color-body)' }}
					>
						<Group justify='space-between' wrap='wrap'>
							<Group gap='md'>
								{doc.type && (
									<Group gap='xs'>
										<ThemeIcon variant='light' size='sm' color='gray'>
											<IconFile size={14} />
										</ThemeIcon>
										<Text size='sm' fw={500}>
											{formatType(doc.type)}
										</Text>
									</Group>
								)}
								{doc.createdAt && (
									<Group gap='xs'>
										<ThemeIcon variant='light' size='sm' color='gray'>
											<IconCalendar size={14} />
										</ThemeIcon>
										<Text size='sm' c='dimmed'>
											{formatDate(doc.createdAt)}
										</Text>
									</Group>
								)}
							</Group>

							<Group gap='xs'>
								<Tooltip label='Download'>
									<ActionIcon variant='default' onClick={handleDownload}>
										<IconDownload size={16} />
									</ActionIcon>
								</Tooltip>
							</Group>
						</Group>
					</Paper>
					<Divider m={0} />
				</Box>

				<Box h={550}>
					{isPdf ? (
						<iframe
							src={previewUrl}
							style={{ width: '100%', height: '100%', border: 'none' }}
							title='Document Preview'
						/>
					) : (
						<DocumentViewer
							src={previewUrl}
							alt='Document Preview'
							withBorder={false}
						/>
					)}
				</Box>
			</Box>
		</Modal>
	);
}
