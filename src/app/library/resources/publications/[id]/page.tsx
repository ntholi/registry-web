import { Badge, Divider, Group, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDate } from '@/shared/lib/utils/dates';
import { toTitleCase } from '@/shared/lib/utils/utils';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import DocumentViewer from '../../_components/DocumentViewer';
import { deletePublication, getPublication } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function PublicationDetailsPage({ params }: Props) {
	const { id } = await params;
	const publication = await getPublication(id);

	if (!publication) return notFound();

	const authors = publication.publicationAuthors
		?.map((pa) => pa.author.name)
		.join(', ');

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Publication'
				queryKey={['publications']}
				handleDelete={async () => {
					'use server';
					await deletePublication(id);
				}}
			/>
			<DetailsViewBody>
				<Stack gap='lg'>
					<Group justify='space-between'>
						<FieldView label='Title' underline={false}>
							{publication.title}
						</FieldView>
						<Badge variant='light'>{toTitleCase(publication.type)}</Badge>
					</Group>

					{authors && (
						<FieldView label='Authors'>
							<Text>{authors}</Text>
						</FieldView>
					)}

					{publication.datePublished && (
						<FieldView label='Date Published' underline={false}>
							{formatDate(publication.datePublished)}
						</FieldView>
					)}

					{publication.abstract && (
						<FieldView label='Abstract'>{publication.abstract}</FieldView>
					)}

					<FieldView label='Uploaded On' underline={false}>
						{publication.createdAt ? formatDate(publication.createdAt) : '-'}
					</FieldView>

					<Divider label='Document' labelPosition='left' />

					<DocumentViewer
						fileUrl={publication.document?.fileUrl || ''}
						fileName={publication.document?.fileName || ''}
					/>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
