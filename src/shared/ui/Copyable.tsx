'use client';

import { ActionIcon, CopyButton, Group, Popover, Text } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { getBooleanColor } from '@/shared/lib/utils/colors';

type Props = {
	value: string;
	children: ReactNode;
	iconSize?: number;
};

export default function Copyable({ value, children, iconSize = 15 }: Props) {
	return (
		<Group gap='xs' align='center' wrap='nowrap'>
			{children}
			<CopyButton value={value} timeout={2000}>
				{({ copied, copy }) => (
					<Popover opened={copied} position='right' withArrow>
						<Popover.Target>
							<ActionIcon
								variant='subtle'
								color={getBooleanColor(copied, 'highlight')}
								onClick={copy}
								size='sm'
							>
								{copied ? (
									<IconCheck size={iconSize} />
								) : (
									<IconCopy size={iconSize} />
								)}
							</ActionIcon>
						</Popover.Target>
						<Popover.Dropdown p={4} px={8}>
							<Text size='xs'>Copied</Text>
						</Popover.Dropdown>
					</Popover>
				)}
			</CopyButton>
		</Group>
	);
}
