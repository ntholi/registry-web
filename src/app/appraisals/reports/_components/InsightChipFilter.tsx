'use client';

import { Chip, ChipGroup, Divider, Group, ScrollArea } from '@mantine/core';

type Props = {
	tags: string[];
	activeTag: string | null;
	onChange: (tag: string | null) => void;
};

const STATIC_CHIPS = ['Strengths', 'Concerns', 'Training', 'Action Items'];

export default function InsightChipFilter({
	tags,
	activeTag,
	onChange,
}: Props) {
	const dynamicTags = tags.filter(
		(t) => !STATIC_CHIPS.some((s) => s.toLowerCase() === t.toLowerCase())
	);

	return (
		<ScrollArea type='auto' offsetScrollbars>
			<ChipGroup
				multiple={false}
				value={activeTag ?? 'all'}
				onChange={(val) => onChange(val === 'all' ? null : (val as string))}
			>
				<Group gap='xs' wrap='nowrap'>
					<Chip value='all' size='sm'>
						All
					</Chip>
					{STATIC_CHIPS.map((chip) => (
						<Chip key={chip} value={chip.toLowerCase()} size='sm'>
							{chip}
						</Chip>
					))}
					{dynamicTags.length > 0 && <Divider orientation='vertical' />}
					{dynamicTags.map((tag) => (
						<Chip key={tag} value={tag.toLowerCase()} size='sm'>
							{tag}
						</Chip>
					))}
				</Group>
			</ChipGroup>
		</ScrollArea>
	);
}
