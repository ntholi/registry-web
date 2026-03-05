'use client';

import { Anchor, Group, PasswordInput, Stack } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { FieldView } from '@/shared/ui/adease';
import Copyable from '@/shared/ui/Copyable';
import type { ExternalLibrary } from '../_lib/types';

type Props = {
	library: ExternalLibrary;
};

export default function DetailsContent({ library }: Props) {
	return (
		<Stack gap='md'>
			<FieldView label='Name'>{library.name}</FieldView>

			<FieldView label='URL'>
				<Anchor href={library.url} target='_blank' rel='noopener noreferrer'>
					<Group gap='xs'>
						{library.url}
						<IconExternalLink size={14} />
					</Group>
				</Anchor>
			</FieldView>

			{library.username && (
				<FieldView label='Username'>
					<Copyable value={library.username}>{library.username}</Copyable>
				</FieldView>
			)}

			{library.password && (
				<FieldView label='Password'>
					<Copyable value={library.password}>
						<PasswordInput
							value={library.password}
							readOnly
							variant='unstyled'
							styles={{ input: { width: 150 } }}
						/>
					</Copyable>
				</FieldView>
			)}

			{library.description && (
				<FieldView label='Description / Instructions'>
					{library.description}
				</FieldView>
			)}
		</Stack>
	);
}
