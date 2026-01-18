'use client';

import { Box, Image, Modal } from '@mantine/core';

type Props = {
	opened: boolean;
	onClose: () => void;
	previewUrl: string | null;
};

export function DocumentPreviewModal({ opened, onClose, previewUrl }: Props) {
	if (!previewUrl) return null;

	const isPdf = previewUrl.toLowerCase().endsWith('.pdf');

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Document Preview'
			size='xl'
			centered
		>
			<Box h={600}>
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
		</Modal>
	);
}
