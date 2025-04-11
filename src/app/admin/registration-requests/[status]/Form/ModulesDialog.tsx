import { semesterModules } from '@/db/schema';
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { ReactNode, useState } from 'react';

type Module = typeof semesterModules.$inferSelect & {
  semesterNumber?: number;
  semesterName?: string;
};

interface ModulesDialogProps {
  onAddModule: (module: Module) => void;
  modules: Module[];
  isLoading: boolean;
  selectedModules: { id: number }[];
  disabled?: boolean;
  children?: ReactNode;
}

export default function ModulesDialog({
  onAddModule,
  modules: availableModules,
  isLoading,
  selectedModules,
  disabled = false,
  children,
}: ModulesDialogProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = availableModules
    ? availableModules.filter(
        (mod) =>
          mod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mod.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const modulesBySemester = filteredModules.reduce(
    (acc, module) => {
      const semesterKey = module.semesterNumber || 0;
      if (!acc[semesterKey]) {
        acc[semesterKey] = {
          name: module.semesterName || `Semester ${semesterKey}`,
          modules: [],
        };
      }
      acc[semesterKey].modules.push(module);
      return acc;
    },
    {} as Record<number, { name: string; modules: Module[] }>,
  );

  const handleAddModule = (module: Module) => {
    onAddModule(module);
    close();
  };

  return (
    <>
      {children ? (
        <div onClick={disabled ? undefined : open}>{children}</div>
      ) : (
        <ActionIcon onClick={open} disabled={disabled}>
          <IconPlus size='1rem' />
        </ActionIcon>
      )}

      <Modal opened={opened} onClose={close} title='Select Module' size='xl'>
        <Stack>
          <TextInput
            placeholder='Search modules...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size='1rem' />}
          />

          <Box style={{ maxHeight: '600px', overflow: 'auto' }}>
            {isLoading ? (
              <Text ta='center' p='md'>
                Loading modules...
              </Text>
            ) : filteredModules.length === 0 ? (
              <Text c='dimmed' ta='center' p='md'>
                No modules found
              </Text>
            ) : (
              <Accordion variant='separated'>
                {Object.entries(modulesBySemester)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([semester, { name, modules }]) => (
                    <Accordion.Item key={semester} value={semester}>
                      <Accordion.Control>
                        <Text fw={500}>{name}</Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Code</Table.Th>
                              <Table.Th>Name</Table.Th>
                              <Table.Th>Type</Table.Th>
                              <Table.Th>Credits</Table.Th>
                              <Table.Th>Action</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {modules.map((module) => (
                              <Table.Tr key={module.id}>
                                <Table.Td>{module.code}</Table.Td>
                                <Table.Td>{module.name}</Table.Td>
                                <Table.Td>{module.type}</Table.Td>
                                <Table.Td>{module.credits}</Table.Td>
                                <Table.Td>
                                  <Button
                                    size='xs'
                                    variant='light'
                                    onClick={() => handleAddModule(module)}
                                    disabled={selectedModules.some(
                                      (m) => m.id === module.id,
                                    )}
                                  >
                                    {selectedModules.some(
                                      (m) => m.id === module.id,
                                    )
                                      ? 'Added'
                                      : 'Add'}
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
              </Accordion>
            )}
          </Box>
        </Stack>
      </Modal>
    </>
  );
}
