'use client';

import { ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { pdf } from '@react-pdf/renderer';
import { IconDownload } from '@tabler/icons-react';
import QRCode from 'qrcode';
import { useState } from 'react';
import { getPassphrasesForClass } from '../_server/actions';
import PassphraseSlipsPDF from './PassphraseSlipsPDF';

type Props = {
	cycleId: string;
	structureSemesterId: number;
	cycleName: string;
	className: string;
};

export default function PassphraseDownloadButton({
	cycleId,
	structureSemesterId,
	cycleName,
	className,
}: Props) {
	const [loading, setLoading] = useState(false);

	async function handleDownload() {
		try {
			setLoading(true);
			const passphrases = await getPassphrasesForClass(
				cycleId,
				structureSemesterId
			);

			if (passphrases.length === 0) {
				notifications.show({
					title: 'No passphrases',
					message: 'Generate passphrases first before downloading.',
					color: 'yellow',
				});
				return;
			}

			const baseUrl = window.location.origin;
			const entries = await Promise.all(
				passphrases.map(async (item) => {
					const feedbackUrl = new URL('/feedback', baseUrl);
					feedbackUrl.searchParams.set('passphrase', item.passphrase);
					const feedbackLink = feedbackUrl.toString();
					const qrCodeDataUrl = await QRCode.toDataURL(feedbackLink, {
						width: 64,
						margin: 1,
						color: {
							dark: '#000000',
							light: '#FFFFFF',
						},
					});

					return {
						passphrase: item.passphrase,
						feedbackUrl: feedbackLink,
						qrCodeDataUrl,
					};
				})
			);

			const blob = await pdf(
				<PassphraseSlipsPDF
					cycleName={cycleName}
					className={className}
					entries={entries}
				/>
			).toBlob();

			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${cycleName}-${className}-passphrases.pdf`
				.toLowerCase()
				.replace(/[^a-z0-9-_]+/g, '-');
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : 'Failed to download PDF';
			notifications.show({
				title: 'Download failed',
				message: msg,
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<ActionIcon
			variant='light'
			size='md'
			onClick={handleDownload}
			loading={loading}
			loaderProps={{ size: 'xs' }}
		>
			{!loading && <IconDownload size={16} />}
		</ActionIcon>
	);
}
