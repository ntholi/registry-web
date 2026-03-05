'use client';

import { ActionIcon, CopyButton, Group, Popover, Text } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { type ReactNode, useState } from 'react';
import { getBooleanColor } from '@/shared/lib/utils/colors';

type Props = {
	value: string;
	children: ReactNode;
	iconSize?: number;
	showOnHover?: boolean;
};

export default function Copyable({
	value,
	children,
	iconSize = 15,
	showOnHover = false,
}: Props) {
	const [hovered, setHovered] = useState(false);
	return (
		<Group
			gap='xs'
			align='center'
			wrap='nowrap'
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
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
								style={{
									opacity: showOnHover && !hovered && !copied ? 0 : 1,
									transition: 'opacity 150ms ease',
								}}
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
