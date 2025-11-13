'use client';

import { ActionIcon, Divider, Flex, Group, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowLeft } from '@tabler/icons-react';
import { useViewSelect } from '@/shared/lib/hooks/useViewSelect';

interface Props {
	studentName: string;
}

export default function GraduationClearanceHeader({ studentName }: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [, setView] = useViewSelect();

	return (
		<>
			<Flex justify='space-between' align='center'>
				{isMobile ? (
					<Group>
						<ActionIcon variant='default' onClick={() => setView('nav')}>
							<IconArrowNarrowLeft size='1rem' />
						</ActionIcon>
						<Title order={3} fw={100} size='1rem'>
							{studentName}
						</Title>
					</Group>
				) : (
					<Title order={3} fw={100}>
						{studentName}
					</Title>
				)}
			</Flex>
			<Divider my={15} />
		</>
	);
}
