'use client';

import { ActionIcon, Indicator, Popover, Text } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';

export type FilterButtonProps = {
	opened?: boolean;
	activeCount?: number;
	label: string;
	onClick: () => void;
};

export function FilterButton({
	opened,
	activeCount = 0,
	label,
	onClick,
}: FilterButtonProps) {
	const hasActive = activeCount > 0;

	return (
		<Popover withArrow withinPortal={false} position='bottom'>
			<Popover.Target>
				<Indicator
					size={16}
					label={activeCount}
					disabled={!hasActive}
					processing={opened}
				>
					<ActionIcon
						variant={hasActive ? 'filled' : 'default'}
						size='input-sm'
						onClick={onClick}
					>
						<IconFilter size={16} />
					</ActionIcon>
				</Indicator>
			</Popover.Target>
			<Popover.Dropdown style={{ pointerEvents: 'none' }}>
				<Text size='sm'>{label}</Text>
			</Popover.Dropdown>
		</Popover>
	);
}
