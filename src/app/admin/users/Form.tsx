'use client';

import { Form } from '@/components/adease';
import { schools, userPositions, userRoles, users } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';
import { findAllSchools, getUserSchools } from '@/server/users/actions';
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { z } from 'zod';

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
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

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

  useState(() => {
    if (defaultSchoolIds.length > 0 && selectedSchools.length === 0) {
      setSelectedSchools(defaultSchoolIds);
    }
  });

  const userFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.enum(userRoles),
    position: z.enum(userPositions).optional(),
    schoolIds: z.array(z.string()).optional(),
  });

  const handleAddSchool = () => {
    if (selectedSchoolId && !selectedSchools.includes(selectedSchoolId)) {
      setSelectedSchools([...selectedSchools, selectedSchoolId]);
      setSelectedSchoolId(null);
      close();
    }
  };

  const handleRemoveSchool = (schoolId: string) => {
    setSelectedSchools(selectedSchools.filter((id) => id !== schoolId));
  };

  const getSchoolNameById = (id: string) => {
    const school = schoolsOptions.find((school) => school.value === id);
    return school ? school.label : 'Unknown School';
  };

  return (
    <>
      <Modal opened={opened} onClose={close} title='Add School' centered>
        <Select
          label='Select School'
          placeholder='Choose a school'
          data={schoolsOptions.filter(
            (school) => !selectedSchools.includes(school.value),
          )}
          value={selectedSchoolId}
          onChange={setSelectedSchoolId}
          searchable
          clearable
        />
        <Group justify='flex-end' mt='md'>
          <Button onClick={handleAddSchool} disabled={!selectedSchoolId}>
            Add
          </Button>
        </Group>
      </Modal>

      <Form
        title={title}
        action={(values) => {
          const formattedValues = {
            ...values,
            schoolIds: selectedSchools.map((id: string) => parseInt(id)),
          };
          return onSubmit(formattedValues);
        }}
        queryKey={['users']}
        schema={userFormSchema}
        defaultValues={{
          ...defaultValues,
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
            <div>
              <Group justify='space-between' align='center' mb='xs'>
                <Text fw={500}>Schools</Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  size='xs'
                  onClick={open}
                  variant='light'
                >
                  Add School
                </Button>
              </Group>

              {selectedSchools.length > 0 ? (
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>School Name</Table.Th>
                      <Table.Th style={{ width: 80 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedSchools.map((schoolId) => (
                      <Table.Tr key={schoolId}>
                        <Table.Td>{getSchoolNameById(schoolId)}</Table.Td>
                        <Table.Td>
                          <ActionIcon
                            color='red'
                            variant='subtle'
                            onClick={() => handleRemoveSchool(schoolId)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text c='dimmed' ta='center' py='md'>
                  No schools assigned. Click &quot;Add School&quot; to assign
                  schools to this user.
                </Text>
              )}
              <input
                type='hidden'
                {...form.getInputProps('schoolIds')}
                value={selectedSchools}
              />
            </div>
          </>
        )}
      </Form>
    </>
  );
}
