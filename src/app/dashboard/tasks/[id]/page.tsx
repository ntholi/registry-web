import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getTask, deleteTask } from '@/server/tasks/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetails({ params }: Props) {
  const { id } = await params;
  const task = await getTask(id);
  
  if (!task) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Task'} 
        queryKey={['tasks']}
        handleDelete={async () => {
          'use server';
          await deleteTask(id);
        }}
      />
      <DetailsViewBody>
        <FieldView label='Title'>{task.title}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}