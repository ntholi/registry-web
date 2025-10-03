import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import {
  getGraduationList,
  deleteGraduationList,
} from '@/server/lists/graduation/actions';
import { Button, Group } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import PopulateButton from './PopulateButton';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GraduationListDetails({ params }: Props) {
  const { id } = await params;
  const graduationList = await getGraduationList(id);

  if (!graduationList) {
    return notFound();
  }

  const isPopulated = graduationList.status === 'populated';

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Graduation List'}
        queryKey={['graduation-lists']}
        handleDelete={async () => {
          'use server';
          await deleteGraduationList(id);
        }}
      />
      <DetailsViewBody>
        <FieldView label='Name'>{graduationList.name}</FieldView>

        <FieldView label='Status'>
          {graduationList.status === 'created' && 'Not Populated'}
          {graduationList.status === 'populated' && 'Populated'}
          {graduationList.status === 'archived' && 'Archived'}
        </FieldView>

        {graduationList.populatedAt && (
          <FieldView label='Last Populated'>
            {new Date(graduationList.populatedAt).toLocaleString()}
          </FieldView>
        )}

        <Group mt='md'>
          <PopulateButton listId={id} isPopulated={isPopulated} />

          {graduationList.spreadsheetUrl && (
            <Button
              component='a'
              href={graduationList.spreadsheetUrl}
              target='_blank'
              rel='noopener noreferrer'
              leftSection={<IconExternalLink size={16} />}
              variant='light'
            >
              Open Google Sheet
            </Button>
          )}
        </Group>
      </DetailsViewBody>
    </DetailsView>
  );
}
