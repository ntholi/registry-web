'use client';

import { Avatar, Box, Group, Paper, Text } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';

type Props = {
	student: {
		name: string;
		stdNo: number;
	};
	photoUrl?: string | null;
	mt?: string;
};

export default function StudentPreviewCard({ student, photoUrl, mt }: Props) {
	return (
		<Paper withBorder p='sm' mt={mt} radius='md' bg='transparent'>
			<Group gap='sm'>
				<Avatar size={46} radius='xl' src={photoUrl ?? undefined} color='blue'>
					<IconUser size={22} />
				</Avatar>
				<Box>
					<Text fw={600} size='sm'>
						{student.name}
					</Text>
					<Text size='xs' c='dimmed'>
						{student.stdNo}
					</Text>
				</Box>
			</Group>
		</Paper>
	);
}
