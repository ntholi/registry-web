'use client';

import {
	ActionIcon,
	Box,
	CopyButton,
	Group,
	Text,
	Tooltip,
} from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { getBooleanColor } from '@/shared/lib/utils/colors';
import Link from '@/shared/ui/Link';

type Props = {
	label: string;
	value: number | string | null | undefined;
	href?: string;
	displayValue?: string | null;
	copyable?: boolean;
};

export default function InfoItem({
	label,
	value,
	href,
	displayValue,
	copyable = true,
}: Props) {
	return (
		<Box
			style={{
				position: 'relative',
			}}
			onMouseEnter={(e) => {
				const copyButton = e.currentTarget.querySelector(
					'.copy-button'
				) as HTMLElement;
				if (copyButton) copyButton.style.opacity = '1';
			}}
			onMouseLeave={(e) => {
				const copyButton = e.currentTarget.querySelector(
					'.copy-button'
				) as HTMLElement;
				if (copyButton) copyButton.style.opacity = '0';
			}}
		>
			<Text size='sm' c='dimmed'>
				{label}
			</Text>
			<Group>
				{href ? (
					<Link href={href} size='sm' fw={500}>
						{displayValue ?? value ?? 'N/A'}
					</Link>
				) : (
					<Text size='sm' fw={500}>
						{displayValue ?? value ?? 'N/A'}
					</Text>
				)}
				{copyable && value && (
					<CopyButton value={String(value)}>
						{({ copied, copy }) => (
							<Tooltip label={copied ? 'Copied' : 'Copy'}>
								<ActionIcon
									variant='subtle'
									color={getBooleanColor(copied, 'highlight')}
									onClick={copy}
									className='copy-button'
									style={{
										opacity: 0,
										transition: 'opacity 0.2s ease',
									}}
								>
									{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
								</ActionIcon>
							</Tooltip>
						)}
					</CopyButton>
				)}
			</Group>
		</Box>
	);
}
