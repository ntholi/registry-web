import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getSignup, deleteSignup } from '@/server/signups/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SignupDetails({ params }: Props) {
  const { id } = await params;
  const signup = await getSignup(id);
  
  if (!signup) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Signup'} 
        queryKey={['signups']}
        handleDelete={async () => {
          'use server';
          await deleteSignup(id);
        }}
      />
      <DetailsViewBody>
        <FieldView label='User Id'>{signup.userId}</FieldView>
        <FieldView label='Name'>{signup.name}</FieldView>
        <FieldView label='Std No'>{signup.stdNo}</FieldView>
        <FieldView label='Message'>{signup.message}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}