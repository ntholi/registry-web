'use client';

import {
	ActionIcon,
	Anchor,
	CopyButton,
	Group,
	PasswordInput,
	Stack,
	Tooltip,
} from '@mantine/core';
import { IconCheck, IconCopy, IconExternalLink } from '@tabler/icons-react';
import { FieldView } from '@/shared/ui/adease';
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
					<Group gap='xs'>
						{library.username}
						<CopyButton value={library.username} timeout={2000}>
							{({ copied, copy }) => (
								<Tooltip
									label={copied ? 'Copied' : 'Copy'}
									withArrow
									position='right'
								>
									<ActionIcon
										color={copied ? 'teal' : 'gray'}
										variant='subtle'
										onClick={copy}
										size='xs'
									>
										{copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
									</ActionIcon>
								</Tooltip>
							)}
						</CopyButton>
					</Group>
				</FieldView>
			)}

			{library.password && (
				<FieldView label='Password'>
					<Group gap='xs'>
						<PasswordInput
							value={library.password}
							readOnly
							variant='unstyled'
							styles={{ input: { width: 150 } }}
						/>
						<CopyButton value={library.password} timeout={2000}>
							{({ copied, copy }) => (
								<Tooltip
									label={copied ? 'Copied' : 'Copy'}
									withArrow
									position='right'
								>
									<ActionIcon
										color={copied ? 'teal' : 'gray'}
										variant='subtle'
										onClick={copy}
										size='xs'
									>
										{copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
									</ActionIcon>
								</Tooltip>
							)}
						</CopyButton>
					</Group>
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
