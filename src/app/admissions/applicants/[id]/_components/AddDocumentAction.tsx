'use client';

import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { UploadModal } from '../documents/_components/UploadModal';

type Props = {
	applicantId: string;
};

export default function AddDocumentAction({ applicantId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	return (
		<>
			<Button
				variant='default'
				size='xs'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				Add
			</Button>

			<UploadModal opened={opened} onClose={close} applicantId={applicantId} />
		</>
	);
}
