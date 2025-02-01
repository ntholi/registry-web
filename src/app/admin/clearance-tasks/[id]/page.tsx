import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getClearanceTask, deleteClearanceTask } from '@/server/clearance-tasks/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceTaskDetails({ params }: Props) {
  const { id } = await params;
  const clearanceTask = await getClearanceTask(Number(id));
  
  if (!clearanceTask) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Clearance Task'} 
        queryKey={['clearanceTasks']}
        handleDelete={async () => {
          'use server';
          await deleteClearanceTask(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Clearance Request'>{clearanceTask.clearanceRequest}</FieldView>
        <FieldView label='Department'>{clearanceTask.department}</FieldView>
        <FieldView label='Status'>{clearanceTask.status}</FieldView>
        <FieldView label='Message'>{clearanceTask.message}</FieldView>
        <FieldView label='Cleared By'>{clearanceTask.clearedBy}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}