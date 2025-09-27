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
import { GraduationListActions } from './GraduationListActions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GraduationListDetails({ params }: Props) {
  const { id } = await params;
  const graduationList = await getGraduationList(id);

  if (!graduationList) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={graduationList.name}
        queryKey={['graduation-lists']}
        handleDelete={async () => {
          'use server';
          await deleteGraduationList(id);
        }}
      />
      <DetailsViewBody>
        <FieldView label='Name'>{graduationList.name}</FieldView>
        <FieldView label='Status'>
          {graduationList.status === 'created' && 'Created'}
          {graduationList.status === 'populated' && 'Populated'}
          {graduationList.status === 'archived' && 'Archived'}
        </FieldView>
        {graduationList.populatedAt && (
          <FieldView label='Last Populated'>
            {new Date(graduationList.populatedAt).toLocaleString()}
          </FieldView>
        )}
        <GraduationListActions graduationList={graduationList} />
      </DetailsViewBody>
    </DetailsView>
  );
}
