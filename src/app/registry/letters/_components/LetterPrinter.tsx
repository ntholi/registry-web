'use client';

import { Button } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { logLetterPrint } from '../_server/actions';
import LetterPDF from './LetterPDF';

type Recipient = {
	title: string;
	org: string;
	address: string | null;
	city: string | null;
};

type Props = {
	letterId: string;
	content: string;
	serialNumber: string;
	recipient?: Recipient | null;
	salutation?: string | null;
	subject?: string | null;
	signOffName?: string | null;
	signOffTitle?: string | null;
};

export default function LetterPrinter({
	letterId,
	content,
	serialNumber,
	recipient,
	salutation,
	subject,
	signOffName,
	signOffTitle,
}: Props) {
	const [loading, setLoading] = useState(false);
	const qc = useQueryClient();
	const logPrint = useActionMutation(logLetterPrint, {
		onSuccess: async () => {
			await qc.invalidateQueries({
				queryKey: ['letter-print-history', letterId],
			});
		},
	});

	async function handlePrint() {
		setLoading(true);
		try {
			await logPrint.mutateAsync(letterId);

			const blob = await pdf(
				<LetterPDF
					content={content}
					serialNumber={serialNumber}
					recipient={recipient}
					salutation={salutation}
					subject={subject}
					signOffName={signOffName}
					signOffTitle={signOffTitle}
				/>
			).toBlob();

			const url = URL.createObjectURL(blob);
			const iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			iframe.src = url;
			document.body.appendChild(iframe);

			iframe.onload = () => {
				if (iframe.contentWindow) {
					iframe.contentWindow.focus();
					iframe.contentWindow.print();
					iframe.contentWindow.addEventListener('afterprint', () => {
						URL.revokeObjectURL(url);
						iframe.remove();
						setLoading(false);
					});
				} else {
					URL.revokeObjectURL(url);
					iframe.remove();
					setLoading(false);
				}
			};

			iframe.onerror = () => {
				URL.revokeObjectURL(url);
				iframe.remove();
				setLoading(false);
			};
		} catch {
			setLoading(false);
		}
	}

	return (
		<Button
			leftSection={<IconPrinter size='1rem' />}
			variant='subtle'
			color='gray'
			size='xs'
			onClick={handlePrint}
			disabled={loading || logPrint.isPending}
		>
			Print
		</Button>
	);
}
