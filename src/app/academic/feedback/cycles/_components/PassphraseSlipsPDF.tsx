import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';

type PassphraseSlipEntry = {
	passphrase: string;
	qrCodeDataUrl: string;
};

type Props = {
	cycleName: string;
	className: string;
	feedbackPath: string;
	entries: PassphraseSlipEntry[];
};

const tw = createTw({});

export default function PassphraseSlipsPDF({
	cycleName,
	className,
	feedbackPath,
	entries,
}: Props) {
	const cols: PassphraseSlipEntry[][] = [];
	for (let i = 0; i < entries.length; i += 3) {
		cols.push(entries.slice(i, i + 3));
	}

	return (
		<Document>
			<Page size='A4' style={tw('bg-white p-5 text-[10px]')}>
				<View style={tw('mb-3 border-b border-gray-300 pb-2')}>
					<Text style={tw('text-[14px] font-bold')}>{cycleName}</Text>
					<Text style={tw('text-[11px] text-gray-700')}>{className}</Text>
				</View>
				{cols.map((row, idx) => (
					<View key={idx} wrap={false} style={tw('flex-row gap-2 mb-2')}>
						{row.map((entry) => (
							<Slip
								key={entry.passphrase}
								entry={entry}
								feedbackPath={feedbackPath}
							/>
						))}
					</View>
				))}
			</Page>
		</Document>
	);
}

type SlipProps = {
	entry: PassphraseSlipEntry;
	feedbackPath: string;
};

function Slip({ entry, feedbackPath }: SlipProps) {
	return (
		<View
			style={tw(
				'w-[32%] border border-gray-300 rounded p-2 flex-row items-center gap-2'
			)}
		>
			<Image src={entry.qrCodeDataUrl} style={tw('w-10 h-10')} />
			<View style={tw('flex-1')}>
				<Text style={tw('text-[8px] font-bold mb-0.5')}>Student Feedback</Text>
				<Text style={tw('text-[7px] text-gray-600 mb-1')}>
					Visit {feedbackPath}
				</Text>
				<Text style={tw('text-[7px] text-gray-500')}>Passphrase</Text>
				<Text style={tw('text-[11px] font-bold')}>{entry.passphrase}</Text>
			</View>
		</View>
	);
}
