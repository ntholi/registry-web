import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from '@react-pdf/renderer';

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

const s = StyleSheet.create({
	page: {
		backgroundColor: '#ffffff',
		paddingHorizontal: 28,
		paddingVertical: 24,
	},
	header: {
		marginBottom: 14,
		paddingBottom: 8,
		borderBottomWidth: 1.5,
		borderBottomColor: '#e5e7eb',
	},
	headerTitle: {
		fontSize: 14,
		fontFamily: 'Helvetica-Bold',
		color: '#111827',
	},
	headerSub: {
		fontSize: 10,
		color: '#6b7280',
		marginTop: 2,
	},
	row: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 10,
	},
	slip: {
		width: '48%',
		flexDirection: 'row',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		overflow: 'hidden',
	},
	qrPanel: {
		paddingVertical: 5,
		paddingHorizontal: 6,
		justifyContent: 'center',
		alignItems: 'center',
		borderRightWidth: 1,
		borderRightColor: '#e5e7eb',
	},
	qr: { width: 50, height: 50 },
	textPanel: {
		flex: 1,
		paddingVertical: 5,
		paddingHorizontal: 10,
		justifyContent: 'center',
	},
	url: {
		fontSize: 8,
		color: '#000000',
		lineHeight: 1.3,
	},
	divider: {
		height: 1,
		backgroundColor: '#e5e7eb',
		marginVertical: 5,
	},
	passphraseLabel: {
		fontSize: 6,
		color: '#9ca3af',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 1,
	},
	passphrase: {
		fontSize: 12,
		fontFamily: 'Helvetica-Bold',
		color: '#000000',
		letterSpacing: 1.5,
	},
});

export default function PassphraseSlipsPDF({
	cycleName,
	className,
	feedbackPath,
	entries,
}: Props) {
	const rows: PassphraseSlipEntry[][] = [];
	for (let i = 0; i < entries.length; i += 2) {
		rows.push(entries.slice(i, i + 2));
	}

	return (
		<Document>
			<Page size='A4' style={s.page}>
				<View style={s.header}>
					<Text style={s.headerTitle}>{cycleName}</Text>
					<Text style={s.headerSub}>{className}</Text>
				</View>
				{rows.map((row, idx) => (
					<View key={idx} wrap={false} style={s.row}>
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
		<View style={s.slip}>
			<View style={s.qrPanel}>
				<Image src={entry.qrCodeDataUrl} style={s.qr} />
			</View>
			<View style={s.textPanel}>
				<Text style={s.url}>{feedbackPath}</Text>
				<View style={s.divider} />
				<View>
					<Text style={s.passphraseLabel}>Passphrase</Text>
					<Text style={s.passphrase}>{entry.passphrase}</Text>
				</View>
			</View>
		</View>
	);
}
