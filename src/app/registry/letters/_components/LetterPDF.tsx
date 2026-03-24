import { Document, Font, Image, Page, Text, View } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';

type Recipient = {
	title: string;
	org: string;
	address: string | null;
	city: string | null;
};

type Props = {
	content: string;
	serialNumber: string;
	recipient?: Recipient | null;
	salutation?: string | null;
	subject?: string | null;
	signOffName?: string | null;
	signOffTitle?: string | null;
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

type Segment = { text: string; bold: boolean };
type Paragraph = { segments: Segment[] };

function parseHtmlToParagraphs(html: string): Paragraph[] {
	const blocks = html
		.split(/<\/p>/gi)
		.map((b) => b.replace(/<p[^>]*>/gi, '').trim())
		.filter(Boolean);

	return blocks.map((block) => {
		const cleaned = block
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<[^>]+>/g, (tag) => {
				if (/<strong>/i.test(tag)) return '\x00BOLD_START\x00';
				if (/<\/strong>/i.test(tag)) return '\x00BOLD_END\x00';
				return '';
			});

		const segments: Segment[] = [];
		let bold = false;
		for (const part of cleaned.split('\x00')) {
			if (part === 'BOLD_START') {
				bold = true;
			} else if (part === 'BOLD_END') {
				bold = false;
			} else if (part) {
				segments.push({ text: part, bold });
			}
		}
		return { segments };
	});
}

export default function LetterPDF({
	content,
	serialNumber,
	recipient,
	salutation,
	subject,
	signOffName,
	signOffTitle,
}: Props) {
	const paragraphs = parseHtmlToParagraphs(content);

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

				<View style={tw('flex-row justify-end mb-6')}>
					<Text style={tw('text-[10pt]')}>Ref: {serialNumber}</Text>
				</View>

				{recipient && (
					<View style={tw('mb-4')}>
						<Text style={tw('leading-[1.4]')}>{recipient.title}</Text>
						<Text style={tw('leading-[1.4]')}>{recipient.org}</Text>
						{recipient.address && (
							<Text style={tw('leading-[1.4]')}>{recipient.address}</Text>
						)}
						{recipient.city && (
							<Text style={tw('leading-[1.4]')}>{recipient.city}</Text>
						)}
					</View>
				)}

				{salutation && (
					<View style={tw('mb-4')}>
						<Text>{salutation}</Text>
					</View>
				)}

				{subject && (
					<View style={tw('mb-4')}>
						<Text style={tw('font-bold underline')}>Re: {subject}</Text>
					</View>
				)}

				<View style={tw('mb-8')}>
					{paragraphs.map((para, i) => (
						<Text key={i} style={tw('mb-[4pt] leading-[1.4]')}>
							{para.segments.map((seg, j) => (
								<Text key={j} style={tw(seg.bold ? 'font-bold' : '')}>
									{seg.text}
								</Text>
							))}
						</Text>
					))}
				</View>

				<View style={tw('mb-2')}>
					<Text>Yours faithfully,</Text>
				</View>

				<View style={tw('mt-auto')}>
					<Image
						style={tw('h-[50pt] mb-1')}
						src='/images/signature_small.png'
					/>
					<View style={tw('border-b border-black w-[200pt] mb-1')} />
					<Text style={tw('text-[10pt] font-bold')}>
						{signOffName || 'Registrar'}
					</Text>
					{signOffTitle && (
						<Text style={tw('text-[10pt]')}>{signOffTitle}</Text>
					)}
				</View>
			</Page>
		</Document>
	);
}
