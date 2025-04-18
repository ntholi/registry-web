import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getUser } from '@/server/users/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserDetails({ params }: Props) {
  const { id } = await params;
  const lecturer = await getUser(id);

  if (!lecturer) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader title={'Lecturer'} queryKey={['lecturers']} />
      <DetailsViewBody>
        <FieldView label='Name'>{lecturer.name}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
