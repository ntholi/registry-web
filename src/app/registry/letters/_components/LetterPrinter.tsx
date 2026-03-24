'use client';

import { Button } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useState } from 'react';
import LetterPDF from './LetterPDF';

type Props = {
	content: string;
	serialNumber: string;
};

export default function LetterPrinter({ content, serialNumber }: Props) {
	const [loading, setLoading] = useState(false);

	async function handlePrint() {
		setLoading(true);
		try {
			const blob = await pdf(
				<LetterPDF content={content} serialNumber={serialNumber} />
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
			disabled={loading}
		>
			Print
		</Button>
	);
}
