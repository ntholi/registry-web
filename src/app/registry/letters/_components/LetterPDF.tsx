import { Document, Font, Image, Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { formatDate } from '@/shared/lib/utils/dates';

type Props = {
	content: string;
	serialNumber: string;
	createdAt: Date | string | null | undefined;
};

Font.register({
	family: 'Tahoma',
	fonts: [
		{ src: '/fonts/TAHOMA_NORMAL.TTF' },
		{ src: '/fonts/TAHOMA_BOLD.TTF', fontWeight: 'bold' },
	],
});

const tw = createTw({
	fontFamily: {
		tahoma: ['Tahoma'],
	},
});

function parseHtmlToElements(html: string) {
	const elements: { type: string; text: string; bold?: boolean }[] = [];

	const stripped = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n\n')
		.replace(/<\/li>/gi, '\n')
		.replace(/<\/h[1-6]>/gi, '\n\n');

	const withoutTags = stripped.replace(/<strong>(.*?)<\/strong>/gi, (_, g) => {
		elements.push({ type: 'bold', text: g });
		return `\x00BOLD${elements.length - 1}\x00`;
	});

	const plain = withoutTags.replace(/<[^>]+>/g, '');

	const parts = plain.split(/\x00BOLD(\d+)\x00/);
	const result: { text: string; bold: boolean }[] = [];

	for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 0) {
			if (parts[i]) result.push({ text: parts[i], bold: false });
		} else {
			const idx = Number(parts[i]);
			result.push({ text: elements[idx].text, bold: true });
		}
	}

	return result;
}

export default function LetterPDF({ content, serialNumber, createdAt }: Props) {
	const parts = parseHtmlToElements(content);

	return (
		<Document>
			<Page
				size='A4'
				style={tw('flex-col bg-white p-12 font-tahoma text-[11pt]')}
			>
				<View style={tw('items-center mb-6')}>
					<Image style={tw('h-[80pt] mb-2')} src='/images/logo-lesotho.jpg' />
					<Text style={tw('text-[8pt] text-gray-500 mt-1')}>
						Maseru, Lesotho
					</Text>
				</View>

				<View style={tw('flex-row justify-between mb-6')}>
					<Text style={tw('text-[10pt]')}>
						Date: {formatDate(createdAt ?? new Date())}
					</Text>
					<Text style={tw('text-[10pt]')}>Ref: {serialNumber}</Text>
				</View>

				<View style={tw('mb-8 leading-[1.6]')}>
					{parts.map((part, i) => (
						<Text key={i} style={tw(part.bold ? 'font-bold' : '')}>
							{part.text}
						</Text>
					))}
				</View>

				<View style={tw('mt-auto')}>
					<Image
						style={tw('h-[50pt] mb-1')}
						src='/images/signature_small.png'
					/>
					<View style={tw('border-b border-black w-[200pt] mb-1')} />
					<Text style={tw('text-[10pt] font-bold')}>Registrar</Text>
				</View>
			</Page>
		</Document>
	);
}
