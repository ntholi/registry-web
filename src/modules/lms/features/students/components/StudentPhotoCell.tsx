'use client';

import {
	Avatar,
	Box,
	Center,
	Image,
	Modal,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getStudentPhoto } from '@registry/students';
import { IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

type StudentPhotoCellProps = {
	stdNo: number;
	name: string;
};

export default function StudentPhotoCell({
	stdNo,
	name,
}: StudentPhotoCellProps) {
	const { data: photoUrl } = useQuery({
		queryKey: ['student-photo', stdNo],
		queryFn: () => getStudentPhoto(stdNo),
		staleTime: 1000 * 60 * 3,
	});

	const [opened, { open, close }] = useDisclosure(false);

	if (!photoUrl) {
		return (
			<Box display='flex' style={{ alignItems: 'center', gap: '8px' }}>
				<Avatar src={null} alt={name} size={32} radius='sm'>
					<IconUser size='1.2rem' />
				</Avatar>
			</Box>
		);
	}

	return (
		<>
			<Modal
				title={`${name} (${stdNo})`}
				opened={opened}
				onClose={close}
				size='lg'
				radius='md'
				centered
			>
				<Center>
					<Image
						src={photoUrl}
						alt={`${name} photo`}
						fit='contain'
						h='100%'
						radius='md'
						w='98%'
					/>
				</Center>
			</Modal>

			<Box display='flex' style={{ alignItems: 'center', gap: '8px' }}>
				<UnstyledButton onClick={open}>
					<Avatar src={photoUrl} alt={name} size={32} radius='sm'>
						<IconUser size='1.2rem' />
					</Avatar>
				</UnstyledButton>
			</Box>
		</>
	);
}
