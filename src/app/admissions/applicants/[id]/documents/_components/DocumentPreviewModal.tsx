'use client';

import {
	Badge,
	Box,
	Group,
	Image,
	Modal,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCalendar,
	IconCertificate,
	IconFile,
	IconUser,
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
					<Box
						pos='absolute'
						bottom={0}
						left={0}
						right={0}
						p='md'
						style={{
							background:
								'linear-gradient(transparent 0%, rgba(0, 0, 0, 0.7) 30%)',
							backdropFilter: 'blur(4px)',
						}}
					>
						<Stack gap='xs'>
							<Group gap='lg' wrap='wrap'>
								{document.type && (
									<Group gap='xs'>
										<ThemeIcon variant='transparent' size='sm' c='white'>
											<IconFile size={14} />
										</ThemeIcon>
										<Text size='sm' c='white' fw={500}>
											{formatType(document.type)}
										</Text>
									</Group>
								)}
								{document.createdAt && (
									<Group gap='xs'>
										<ThemeIcon variant='transparent' size='sm' c='white'>
											<IconCalendar size={14} />
										</ThemeIcon>
										<Text size='sm' c='dimmed'>
											Uploaded {formatDate(document.createdAt)}
										</Text>
									</Group>
								)}
							</Group>

							{isCertified && (
								<Group gap='lg' wrap='wrap'>
									<Badge
										leftSection={<IconCertificate size={12} />}
										color='green'
										variant='light'
										size='sm'
									>
										Certified
									</Badge>
									{document.certifiedBy && (
										<Group gap='xs'>
											<ThemeIcon variant='transparent' size='sm' c='white'>
												<IconUser size={14} />
											</ThemeIcon>
											<Text size='sm' c='white'>
												{document.certifiedBy}
											</Text>
										</Group>
									)}
									{document.certifiedDate && (
										<Group gap='xs'>
											<ThemeIcon variant='transparent' size='sm' c='white'>
												<IconCalendar size={14} />
											</ThemeIcon>
											<Text size='sm' c='dimmed'>
												{document.certifiedDate}
											</Text>
										</Group>
									)}
								</Group>
							)}
						</Stack>
					</Box>
				)}
			</Box>
		</Modal>
	);
}
