'use client';

import { Grid, GridCol, Paper, Text } from '@mantine/core';
import type React from 'react';
import Copyable from '@/shared/ui/Copyable';
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
						label='Transaction No.'
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
	const inner = content || (
		<Text size='sm' fw={500} ff={textProps?.ff}>
			{value}
		</Text>
	);

	return (
		<>
			<Text size='xs' c='dimmed'>
				{label}
			</Text>
			{copyable ? <Copyable value={value}>{inner}</Copyable> : inner}
		</>
	);
}
