'use client';

import { Form } from '@/components/adease';
import { schools, userPositions, userRoles, users } from '@/db/schema';
import { findAllSchools, getUserSchools } from '@/server/users/actions';
import { toTitleCase } from '@/lib/utils';
import { MultiSelect, Select, TextInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

type User = typeof users.$inferInsert;

type UserWithSchools = User & { schoolIds?: number[] };

type Props = {
  onSubmit: (values: UserWithSchools) => Promise<User>;
  defaultValues?: Partial<UserWithSchools>;
  onSuccess?: (value: User) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

export default function UserForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => findAllSchools(),
  });

  const { data: userSchoolsData } = useQuery({
    queryKey: ['userSchools', defaultValues?.id],
    queryFn: () =>
      defaultValues?.id
        ? getUserSchools(defaultValues.id)
        : Promise.resolve([]),
    enabled: !!defaultValues?.id,
  });

  const schoolsOptions = schoolsData?.data
    ? schoolsData.data.map((school: typeof schools.$inferSelect) => ({
        value: school.id.toString(),
        label: school.name,
      }))
    : [];

  const defaultSchoolIds = userSchoolsData
    ? userSchoolsData.map((userSchool: { schoolId: number }) =>
        userSchool.schoolId.toString(),
      )
    : [];

  const userFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.enum(userRoles),
    position: z.enum(userPositions).optional(),
    schoolIds: z.array(z.string()).optional(),
  });

  return (
    <Form
      title={title}
      action={(values) => {
        const formattedValues = {
          ...values,
          schoolIds: Array.isArray(values.schoolIds)
            ? values.schoolIds.map((id: string) => parseInt(id))
            : undefined,
        };
        return onSubmit(formattedValues);
      }}
      queryKey={['users']}
      schema={userFormSchema}
      defaultValues={{
        ...defaultValues,
        schoolIds: defaultSchoolIds,
      }}
      onSuccess={({ id }) => {
        router.push(`/admin/users/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Name' {...form.getInputProps('name')} />
          <Select
            label='Role'
            searchable
            data={userRoles
              .map((role) => ({
                value: role,
                label: toTitleCase(role),
              }))
              .sort((a, b) => a.label.localeCompare(b.label))}
            {...form.getInputProps('role')}
          />
          {form.values.role === 'academic' && (
            <Select
              label='Position'
              searchable
              data={userPositions.map((position) => ({
                value: position,
                label: toTitleCase(position),
              }))}
              {...form.getInputProps('position')}
            />
          )}
          <MultiSelect
            label='Schools'
            data={schoolsOptions}
            searchable
            placeholder='Select schools'
            {...form.getInputProps('schoolIds')}
          />
        </>
      )}
    </Form>
  );
}
