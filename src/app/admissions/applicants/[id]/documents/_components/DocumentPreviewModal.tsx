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
			<Stack gap='md'>
				<Box h={500}>
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
				</Box>

				{document && (
					<Paper withBorder p='md' bg='var(--mantine-color-dark-6)' radius='md'>
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

							<Group gap='sm' wrap='wrap'>
								{isCertified ? (
									<Badge
										leftSection={<IconCertificate size={12} />}
										color='green'
										variant='light'
									>
										Certified
									</Badge>
								) : (
									<Badge
										leftSection={<IconCertificateOff size={12} />}
										color='red'
										variant='light'
									>
										Not Certified
									</Badge>
								)}

								{isCertified && (
									<Group gap='md' ml='auto'>
										{document.certifiedBy && (
											<Text size='sm'>
												<Text span c='dimmed'>
													By:{' '}
												</Text>
												{document.certifiedBy}
											</Text>
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
			</Stack>
		</Modal>
	);
}
