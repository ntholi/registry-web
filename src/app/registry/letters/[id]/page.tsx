import { Card, Group, Text, TypographyStylesProvider } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import LetterPrinter from '../_components/LetterPrinter';
import { deleteLetter, getLetter } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function LetterDetailPage({ params }: Props) {
	const { id } = await params;
	const letter = await getLetter(id);

	if (!letter) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title={letter.serialNumber}
				queryKey={['letters']}
				handleDelete={async () => {
					'use server';
					return deleteLetter(id);
				}}
				hideEdit
			/>
			<DetailsViewBody>
				<Group justify='flex-end' mb='sm'>
					<LetterPrinter
						content={letter.content}
						serialNumber={letter.serialNumber}
						createdAt={letter.createdAt}
					/>
				</Group>
				<Group grow>
					<FieldView label='Serial Number'>{letter.serialNumber}</FieldView>
					<FieldView label='Created'>
						{formatDateTime(letter.createdAt)}
					</FieldView>
				</Group>
				<Card withBorder p='md' mt='md'>
					<Text fw={600} size='sm' mb='xs'>
						Letter Content
					</Text>
					<TypographyStylesProvider>
						<div dangerouslySetInnerHTML={{ __html: letter.content }} />
					</TypographyStylesProvider>
				</Card>
			</DetailsViewBody>
		</DetailsView>
	);
}
