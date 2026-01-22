import { Badge, Divider, Group, Stack } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDate } from '@/shared/lib/utils/dates';
import { toTitleCase } from '@/shared/lib/utils/utils';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import DocumentViewer from '../_components/DocumentViewer';
import { deleteResource, getResource } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ResourceDetailsPage({ params }: Props) {
	const { id } = await params;
	const numericId = Number(id);

	if (Number.isNaN(numericId)) return notFound();

	const resource = await getResource(numericId);

	if (!resource) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Digital Resource'
				queryKey={['resources']}
				handleDelete={async () => {
					'use server';
					await deleteResource(numericId);
				}}
			/>
			<DetailsViewBody>
				<Stack gap='md'>
					<Group justify='space-between'>
						<FieldView label='Title'>{resource.title}</FieldView>
						<Badge variant='light'>{toTitleCase(resource.type)}</Badge>
					</Group>

					{resource.description && (
						<FieldView label='Description'>{resource.description}</FieldView>
					)}

					<Divider label='File Information' labelPosition='left' />

					<Group grow>
						<FieldView label='File Name'>
							{resource.document?.fileName}
						</FieldView>
					</Group>

					<Group grow>
						<FieldView label='Downloadable'>
							{resource.isDownloadable ? 'Yes' : 'No'}
						</FieldView>
						<FieldView label='Uploaded On'>
							{resource.createdAt ? formatDate(resource.createdAt) : '-'}
						</FieldView>
						<FieldView label='Uploaded By'>
							{resource.uploadedByUser?.name || '-'}
						</FieldView>
					</Group>

					<Divider label='Preview' labelPosition='left' />

					<DocumentViewer
						fileUrl={resource.document?.fileUrl || ''}
						fileName={resource.document?.fileName || ''}
						isDownloadable={resource.isDownloadable}
					/>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
