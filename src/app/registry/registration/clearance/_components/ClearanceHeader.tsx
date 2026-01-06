'use client';

import { ActionIcon, Badge, Divider, Flex, Group, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowLeft } from '@tabler/icons-react';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import {
	getBooleanColor,
	getVersionCountColor,
} from '@/shared/lib/utils/colors';

interface Props {
	studentName: string;
	termCode: string;
	versionCount?: number;
}

export default function ClearanceHeader({
	studentName,
	termCode,
	versionCount,
}: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [, setView] = useViewSelect();
	const { activeTerm } = useActiveTerm();

	const isActiveTerm = activeTerm?.code === termCode;

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
				<Group>
					{!isActiveTerm && (
						<Badge
							color={getBooleanColor(!isActiveTerm, 'negative')}
							variant={'filled'}
						>
							{termCode}
						</Badge>
					)}

					{versionCount && (
						<Badge
							color={getVersionCountColor(versionCount)}
							variant='light'
							size='sm'
						>
							Version {versionCount}
						</Badge>
					)}
				</Group>
			</Flex>
			<Divider my={15} />
		</>
	);
}
