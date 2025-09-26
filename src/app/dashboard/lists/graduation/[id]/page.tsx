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
        title={'Graduation List'}
        queryKey={['graduation-lists']}
        handleDelete={async () => {
          'use server';
          await deleteGraduationList(id);
        }}
      />
      <DetailsViewBody>
        <FieldView label='Name'>{graduationList.name}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
