'use client';

import { Avatar, Box, Image, Popover } from '@mantine/core';
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
	const [opened, { close, open }] = useDisclosure(false);
	const { data: photoUrl } = useQuery({
		queryKey: ['student-photo', stdNo],
		queryFn: () => getStudentPhoto(stdNo),
		staleTime: 1000 * 60 * 3,
	});

	if (!photoUrl) {
		return (
			<Box display='flex' style={{ alignItems: 'center', gap: '8px' }}>
				<Avatar src={null} alt={name} size={32} radius='md'>
					<IconUser size='1.2rem' />
				</Avatar>
			</Box>
		);
	}

	return (
		<Box display='flex' style={{ alignItems: 'center', gap: '8px' }}>
			<Popover width={300} withArrow shadow='md' opened={opened}>
				<Popover.Target>
					<Avatar
						src={photoUrl}
						alt={name}
						size={32}
						radius='md'
						style={{
							cursor: 'pointer',
						}}
						onMouseEnter={open}
						onMouseLeave={close}
					>
						<IconUser size='1.2rem' />
					</Avatar>
				</Popover.Target>
				<Popover.Dropdown>
					<Image
						src={photoUrl}
						alt={`${name} photo`}
						fit='contain'
						radius='md'
					/>
				</Popover.Dropdown>
			</Popover>
		</Box>
	);
}
