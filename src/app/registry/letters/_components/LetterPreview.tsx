'use client';

import { Box, Card, Divider, Image, Text } from '@mantine/core';
import { formatDate } from '@/shared/lib/utils/dates';
import { RichTextContent } from '@/shared/ui/adease';

type LetterPreviewProps = {
	content: string;
	recipient?: {
		title: string;
		org: string;
		address: string | null;
		city: string | null;
	} | null;
	salutation?: string | null;
	subject?: string | null;
	signOffName?: string | null;
	signOffTitle?: string | null;
};

export default function LetterPreview({
	content,
	recipient,
	salutation,
	subject,
	signOffName,
	signOffTitle,
}: LetterPreviewProps) {
	return (
		<Card withBorder p='xl' bg='white' style={{ color: 'black' }}>
			{recipient && (
				<Box mb='sm'>
					<Text size='sm'>{recipient.title}</Text>
					<Text size='sm'>{recipient.org}</Text>
					{recipient.address && <Text size='sm'>{recipient.address}</Text>}
					{recipient.city && <Text size='sm'>{recipient.city}</Text>}
				</Box>
			)}

			<Text size='sm' mb='sm'>
				{formatDate(new Date())}
			</Text>

			{salutation && (
				<Text size='sm' mb='sm'>
					{salutation}
				</Text>
			)}

			{subject && (
				<Text size='sm' fw={700} td='underline' mb='sm'>
					Re: {subject}
				</Text>
			)}

			<Box mb='lg'>
				<RichTextContent html={content} />
			</Box>

			<Divider my='sm' variant='dotted' />

			<Box>
				<Text size='sm' mb='xs'>
					Yours faithfully,
				</Text>
				<Image src='/images/signature_small.png' h={50} w='auto' mb={4} />
				<Divider w={200} mb={4} />
				<Text size='sm' fw={700}>
					{signOffName || 'Registrar'}
				</Text>
				{signOffTitle && <Text size='sm'>{signOffTitle}</Text>}
			</Box>
		</Card>
	);
}
