import { FieldView } from '@/components/adease';
import { getGraduationRequest } from '@/server/graduation/requests/actions';
import { Stack, Text } from '@mantine/core';

interface Props {
  value: NonNullable<Awaited<ReturnType<typeof getGraduationRequest>>>;
}

export default function GraduationRequestDetailsView({ value }: Props) {
  return (
    <Stack gap='md'>
      <FieldView label='Student Number'>{value.studentProgram.stdNo}</FieldView>

      <FieldView label='Student Name'>
        {value.studentProgram.student.name}
      </FieldView>

      <FieldView label='Program'>
        {value.studentProgram.structure.program.name}
      </FieldView>

      <FieldView label='School ID'>
        {value.studentProgram.structure.program.schoolId}
      </FieldView>

      <FieldView label='Program Status'>
        {value.studentProgram.status}
      </FieldView>

      <FieldView label='Information Confirmed'>
        {value.informationConfirmed ? 'Yes' : 'No'}
      </FieldView>

      {value.message && (
        <FieldView label='Message'>
          <Text size='sm'>{value.message}</Text>
        </FieldView>
      )}

      <FieldView label='Created At'>
        {value.createdAt
          ? new Date(value.createdAt).toLocaleDateString()
          : 'N/A'}
      </FieldView>

      {value.updatedAt && (
        <FieldView label='Updated At'>
          {new Date(value.updatedAt).toLocaleDateString()}
        </FieldView>
      )}
    </Stack>
  );
}
