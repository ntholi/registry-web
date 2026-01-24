'use client';

import {
	Badge,
	Box,
	Divider,
	Group,
	Image,
	Modal,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCalendar,
	IconCertificate,
	IconCertificateOff,
	IconFile,
} from '@tabler/icons-react';
import { formatDate } from '@/shared/lib/utils/dates';

type DocumentDetails = {
	fileName?: string | null;
	type?: string | null;
	certifiedDate?: string | null;
	certifiedBy?: string | null;
	createdAt?: Date | null;
};

type Props = {
	opened: boolean;
	onClose: () => void;
	previewUrl: string | null;
	document?: DocumentDetails | null;
};

function formatType(type: string | null | undefined): string {
	if (!type) return 'Unknown';
	return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function DocumentPreviewModal({
	opened,
	onClose,
	previewUrl,
	document,
}: Props) {
	if (!previewUrl) return null;

	const isPdf = previewUrl.toLowerCase().endsWith('.pdf');
	const isCertified = !!(document?.certifiedBy || document?.certifiedDate);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Document Preview'
			size='xl'
			centered
		>
			<Box pos='relative' h={600}>
				{isPdf ? (
					<iframe
						src={previewUrl}
						style={{ width: '100%', height: '100%', border: 'none' }}
						title='Document Preview'
					/>
				) : (
					<Image
						src={previewUrl}
						alt='Document Preview'
						fit='contain'
						mah='100%'
					/>
				)}

				{document && (
					<Paper
						withBorder
						p='md'
						pos='absolute'
						bottom={10}
						left={0}
						right={0}
						style={{
							background: 'rgba(33, 33, 33, 0.85)',
							backdropFilter: 'blur(8px)',
						}}
					>
						<Stack gap='sm'>
							<Group gap='lg' wrap='wrap'>
								{document.type && (
									<Group gap='xs'>
										<ThemeIcon variant='light' size='sm' color='gray'>
											<IconFile size={14} />
										</ThemeIcon>
										<Text size='sm' fw={500}>
											{formatType(document.type)}
										</Text>
									</Group>
								)}
								{document.createdAt && (
									<Group gap='xs'>
										<ThemeIcon variant='light' size='sm' color='gray'>
											<IconCalendar size={14} />
										</ThemeIcon>
										<Text size='sm' c='dimmed'>
											Uploaded {formatDate(document.createdAt)}
										</Text>
									</Group>
								)}
							</Group>

							<Divider />

							<Group gap='sm'>
								{isCertified ? (
									<Badge
										leftSection={<IconCertificate size={12} />}
										color='green'
										variant='light'
										radius={'xs'}
									>
										Certified
									</Badge>
								) : (
									<Badge
										leftSection={<IconCertificateOff size={12} />}
										color='red'
										variant='light'
										radius={'xs'}
									>
										Not Certified
									</Badge>
								)}

								{isCertified && (
									<Group gap='md'>
										{document.certifiedBy && (
											<Text size='sm'>{document.certifiedBy}</Text>
										)}
										{document.certifiedDate && (
											<Text size='sm'>
												<Text span c='dimmed'>
													Date:{' '}
												</Text>
												{document.certifiedDate}
											</Text>
										)}
									</Group>
								)}
							</Group>
						</Stack>
					</Paper>
				)}
			</Box>
		</Modal>
	);
}
