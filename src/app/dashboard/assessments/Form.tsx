'use client';

import { Form } from '@/components/adease';
import { assessments } from '@/db/schema';
import { Grid, NumberInput, Select } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { ASSESSMENT_TYPES } from './[id]/assessments';

type Assessment = typeof assessments.$inferInsert;

type Props = {
  onSubmit: (values: Assessment) => Promise<Assessment>;
  defaultValues?: Assessment;
  onSuccess?: (value: Assessment) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function AssessmentForm({
  onSubmit,
  defaultValues,
  title,
}: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['assessments']}
      schema={createInsertSchema(assessments)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/dashboard/assessments/${id}`);
      }}
    >
      {(form) => (
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label='No'
              searchable
              clearable
              placeholder='Assessment (Course Work) Number'
              data={ASSESSMENT_TYPES}
              {...form.getInputProps('assessmentNumber')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label='Assessment Type'
              searchable
              clearable
              data={ASSESSMENT_TYPES}
              {...form.getInputProps('assessmentType')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              label='Total Marks'
              {...form.getInputProps('totalMarks')}
              min={1}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              label='Weight'
              {...form.getInputProps('weight')}
              min={1}
              max={100}
            />
          </Grid.Col>
        </Grid>
      )}
    </Form>
  );
}
