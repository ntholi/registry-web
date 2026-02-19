import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';

type PassphraseSlipEntry = {
	passphrase: string;
	feedbackUrl: string;
	qrCodeDataUrl: string;
};

type Props = {
	cycleName: string;
	className: string;
	entries: PassphraseSlipEntry[];
};

const tw = createTw({});

export default function PassphraseSlipsPDF({
	cycleName,
	className,
	entries,
}: Props) {
	const rows: PassphraseSlipEntry[][] = [];
	for (let i = 0; i < entries.length; i += 2) {
		rows.push(entries.slice(i, i + 2));
	}

	return (
		<Document>
			<Page size='A4' style={tw('bg-white p-5 text-[10px]')}>
				<View style={tw('mb-3 border-b border-gray-300 pb-2')}>
					<Text style={tw('text-[14px] font-bold')}>{cycleName}</Text>
					<Text style={tw('text-[11px] text-gray-700')}>{className}</Text>
					<Text style={tw('text-[9px] text-gray-500')}>
						{entries.length} passphrases
					</Text>
				</View>
				{rows.map((row, idx) => (
					<View key={idx} wrap={false} style={tw('flex-row gap-2 mb-2')}>
						{row.map((entry) => (
							<View
								key={entry.passphrase}
								style={tw('w-[49%] border border-gray-300 rounded p-2')}
							>
								<Text style={tw('text-[9px] text-gray-500 text-center mb-1')}>
									Passphrase
								</Text>
								<Text style={tw('text-[13px] font-bold text-center mb-2')}>
									{entry.passphrase}
								</Text>
								<View style={tw('items-center mb-2')}>
									<Image src={entry.qrCodeDataUrl} style={tw('w-8 h-8')} />
								</View>
								<Text style={tw('text-[8px] text-gray-700 text-center')}>
									Scan QR or open:
								</Text>
								<Text style={tw('text-[8px] text-center')}>
									{entry.feedbackUrl}
								</Text>
							</View>
						))}
					</View>
				))}
			</Page>
		</Document>
	);
}
