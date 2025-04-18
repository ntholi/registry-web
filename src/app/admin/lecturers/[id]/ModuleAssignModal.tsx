'use client';
import { Button, Modal, Stack, Select, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { ModuleSearchInput } from '@/components/ModuleSearchInput';
import { useParams } from 'next/navigation';
import { useState } from 'react';

type FormValues = {
  userId: string;
  moduleId: number;
  structureSemesterId: number;
};

export default function ModuleAssignModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const params = useParams<{ id: string }>();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      userId: params.id,
      moduleId: 0,
      structureSemesterId: 0,
    },
    validate: {
      moduleId: (value) => (value ? null : 'Please select a module'),
      structureSemesterId: (value) =>
        value ? null : 'Please select a semester',
    },
  });

  function handleSubmit(values: FormValues) {
    setIsSubmitting(true);

    console.log('Submitting:', values);

    setTimeout(() => {
      form.reset();
      setSelectedModule(null);
      setSelectedSemester(null);
      setIsSubmitting(false);
      close();
    }, 1000);
  }

  const handleModuleSelect = (moduleId: number | null) => {
    setSelectedModule(moduleId);
    form.setFieldValue('moduleId', moduleId || 0);
  };

  const handleSemesterSelect = (semesterId: string | null) => {
    const id = semesterId ? parseInt(semesterId) : null;
    setSelectedSemester(id);
    form.setFieldValue('structureSemesterId', id || 0);
  };

  return (
    <>
      <Button size='sm' variant='light' onClick={open}>
        Assign Module
      </Button>
      <Modal title='Assign Module' size={'xl'} opened={opened} onClose={close}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap='md'>
            <ModuleSearchInput
              onChange={handleModuleSelect}
              value={selectedModule}
              error={form.errors.moduleId}
              required
            />

            <Select
              label='Select Semester'
              placeholder='Choose a semester'
              data={[
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
                { value: '3', label: 'Semester 3' },
                { value: '4', label: 'Semester 4' },
                { value: '5', label: 'Semester 5' },
                { value: '6', label: 'Semester 6' },
                { value: '7', label: 'Semester 7' },
                { value: '8', label: 'Semester 8' },
              ]}
              value={selectedSemester?.toString() || null}
              onChange={handleSemesterSelect}
              error={form.errors.structureSemesterId}
              required
            />

            <Group justify='flex-end' mt='md'>
              <Button variant='subtle' onClick={close}>
                Cancel
              </Button>
              <Button type='submit' loading={isSubmitting}>
                Assign Module
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
