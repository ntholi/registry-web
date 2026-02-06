'use client';

import { Chip, Group, Stack, Textarea } from '@mantine/core';

const QUICK_COMMENTS = [
	'Repeat Modules Owing',
	'Tuition Fees Owing',
	'Late Registration Owing',
	'Library Fines Owing',
	'IT Fines Owing',
	'Specify Sponsor',
	"Provide Borrower's Number",
	'Outstanding Academic Issues',
];

type Props = {
	value: string | undefined;
	onChange: (value: string | undefined) => void;
};

export default function ClearanceComments({ value, onChange }: Props) {
	const lines = value ? value.split('\n').filter(Boolean) : [];

	function toggle(item: string) {
		if (lines.includes(item)) {
			const filtered = lines.filter((l) => l !== item);
			onChange(filtered.length ? filtered.join('\n') : undefined);
		} else {
			onChange([...lines, item].join('\n'));
		}
	}

	return (
		<Stack>
			<Group gap='xs'>
				{QUICK_COMMENTS.map((item) => (
					<Chip
						key={item}
						checked={lines.includes(item)}
						onChange={() => toggle(item)}
						size='xs'
					>
						{item}
					</Chip>
				))}
			</Group>
			<Textarea
				value={value}
				description='Optional'
				onChange={(e) => onChange(e.currentTarget.value || undefined)}
				placeholder='Add comments about the clearance...'
			/>
		</Stack>
	);
}
