'use client';

import { Avatar, type AvatarProps, Image, Popover } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getStudentPhoto } from '@registry/students';
import { IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

type StudentAvatarProps = {
	stdNo: number;
	name?: string;
	withPopover?: boolean;
} & Omit<AvatarProps, 'src'>;

export default function StudentAvatar({
	stdNo,
	name,
	withPopover = false,
	...avatarProps
}: StudentAvatarProps) {
	const [opened, { close, open }] = useDisclosure(false);
	const { data: photoUrl } = useQuery({
		queryKey: ['student-photo', stdNo],
		queryFn: () => getStudentPhoto(stdNo),
		staleTime: 1000 * 60 * 15,
	});

	const avatar = (
		<Avatar
			src={photoUrl}
			alt={name}
			{...avatarProps}
			style={
				withPopover
					? { cursor: 'pointer', ...avatarProps.style }
					: avatarProps.style
			}
			onMouseEnter={withPopover ? open : undefined}
			onMouseLeave={withPopover ? close : undefined}
		>
			<IconUser size='1.2rem' />
		</Avatar>
	);

	if (!withPopover || !photoUrl) {
		return avatar;
	}

	return (
		<Popover width={300} withArrow shadow='md' opened={opened}>
			<Popover.Target>{avatar}</Popover.Target>
			<Popover.Dropdown>
				<Image
					src={photoUrl}
					alt={`${name ?? 'Student'} photo`}
					fit='contain'
					radius='md'
				/>
			</Popover.Dropdown>
		</Popover>
	);
}
