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
  const users = await getUser(id);

  if (!users) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader title={'Lecturer'} queryKey={['lecturers']} />
      <DetailsViewBody>
        <FieldView label='Name'>{users.name}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
