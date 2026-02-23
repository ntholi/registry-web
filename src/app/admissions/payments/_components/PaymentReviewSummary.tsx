'use client';

import {
	ActionIcon,
	CopyButton,
	Grid,
	GridCol,
	Group,
	Paper,
	Text,
	Tooltip,
} from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import type React from 'react';
import Link from '@/shared/ui/Link';

type Props = {
	applicantName: string;
	applicantId: string | null;
	amount: string;
	reference: string;
	submitted: string;
	depositor: string;
	transactionOrTerminal: string;
};

export default function PaymentReviewSummary({
	applicantName,
	applicantId,
	amount,
	reference,
	submitted,
	depositor,
	transactionOrTerminal,
}: Props) {
	return (
		<Paper withBorder radius='md' p='md'>
			<Grid gutter='md'>
				<GridCol span={{ base: 12, md: 4 }}>
					<CopyableField
						label='Applicant'
						value={applicantName}
						content={
							applicantId ? (
								<Link href={`/admissions/applicants/${applicantId}`}>
									<Text size='sm' fw={500}>
										{applicantName}
									</Text>
								</Link>
							) : (
								<Text size='sm' fw={500}>
									{applicantName}
								</Text>
							)
						}
					/>
				</GridCol>
				<GridCol span={{ base: 12, md: 4 }}>
					<CopyableField label='Amount' value={amount} />
				</GridCol>
				<GridCol span={{ base: 12, md: 4 }}>
					<CopyableField
						label='Reference'
						value={reference}
						textProps={{ ff: 'monospace' }}
					/>
				</GridCol>
				<GridCol span={{ base: 12, md: 4 }}>
					<CopyableField label='Submitted' value={submitted} copyable={false} />
				</GridCol>
				<GridCol span={{ base: 12, md: 4 }}>
					<CopyableField label='Depositor' value={depositor} />
				</GridCol>
				<GridCol span={{ base: 12, md: 4 }}>
					<CopyableField
						label='Transaction Number'
						value={transactionOrTerminal}
					/>
				</GridCol>
			</Grid>
		</Paper>
	);
}

type CopyableFieldProps = {
	label: string;
	value: string;
	content?: React.ReactNode;
	copyable?: boolean;
	textProps?: {
		ff?: string;
	};
};

function CopyableField({
	label,
	value,
	content,
	copyable = true,
	textProps,
}: CopyableFieldProps) {
	return (
		<>
			<Text size='xs' c='dimmed'>
				{label}
			</Text>
			<Group gap='xs' align='center' wrap='nowrap'>
				{content || (
					<Text size='sm' fw={500} ff={textProps?.ff}>
						{value}
					</Text>
				)}
				{copyable && (
					<CopyButton value={value} timeout={2000}>
						{({ copied, copy }) => (
							<Tooltip label={copied ? 'Copied' : 'Copy'}>
								<ActionIcon variant='subtle' onClick={copy}>
									{copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
								</ActionIcon>
							</Tooltip>
						)}
					</CopyButton>
				)}
			</Group>
		</>
	);
}
