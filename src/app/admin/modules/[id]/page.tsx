import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getModule, deleteModule } from '@/server/modules/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
  const { id } = await params;
  const module = await getModule(Number(id));
  
  if (!module) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Module'} 
        queryKey={['modules']}
        handleDelete={async () => {
          'use server';
          await deleteModule(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Code'>{module.code}</FieldView>
        <FieldView label='Name'>{module.name}</FieldView>
        <FieldView label='Status'>{module.status}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}