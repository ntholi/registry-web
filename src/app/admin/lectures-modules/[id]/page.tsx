import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getLecturesModule, deleteLecturesModule } from '@/server/lectures-modules/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LecturesModuleDetails({ params }: Props) {
  const { id } = await params;
  const lecturesModule = await getLecturesModule(Number(id));
  
  if (!lecturesModule) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Lectures Module'} 
        queryKey={['lecturesModules']}
        handleDelete={async () => {
          'use server';
          await deleteLecturesModule(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Module'>{lecturesModule.module}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}