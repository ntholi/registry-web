'use client';

import { Button, Menu } from '@mantine/core';
import { IconChevronRight, IconTemplate } from '@tabler/icons-react';
import type { useEditor } from '@tiptap/react';

type Placeholder = { token: string; label: string };

type PlaceholderGroup = {
	group: string;
	items: readonly Placeholder[];
};

export type PlaceholderMenuProps = {
	editor: NonNullable<ReturnType<typeof useEditor>>;
	groups: readonly PlaceholderGroup[];
};

export function PlaceholderMenu({ editor, groups }: PlaceholderMenuProps) {
	const nested = groups.filter((g) => g.items.length > 1);
	const flat = groups.filter((g) => g.items.length === 1);

	return (
		<Menu position='bottom-start' withinPortal>
			<Menu.Target>
				<Button
					variant='default'
					size='compact-sm'
					leftSection={<IconTemplate size={16} />}
				>
					Placeholder
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				{nested.map((group) => (
					<Menu
						key={group.group}
						trigger='hover'
						position='right-start'
						withinPortal
					>
						<Menu.Target>
							<Menu.Item rightSection={<IconChevronRight size={14} />}>
								{group.group}
							</Menu.Item>
						</Menu.Target>
						<Menu.Dropdown>
							{group.items.map((p) => (
								<Menu.Item
									key={p.token}
									onClick={() =>
										editor?.commands.insertContent(`{{${p.token}}}`)
									}
								>
									{p.label}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>
				))}
				{flat.length > 0 && <Menu.Divider />}
				{flat.flatMap((g) =>
					g.items.map((p) => (
						<Menu.Item
							key={p.token}
							onClick={() => editor?.commands.insertContent(`{{${p.token}}}`)}
						>
							{p.label}
						</Menu.Item>
					))
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
