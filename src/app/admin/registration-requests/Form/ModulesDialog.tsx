import { modules, ModuleStatus } from '@/db/schema';
import {
  Button,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';

type Module = typeof modules.$inferSelect;

interface ModulesDialogProps {
  opened: boolean;
  onClose: () => void;
  onAddModule: (module: Module) => void;
  modules: Module[];
  isLoading: boolean;
  selectedModules: { id: number }[];
}

export default function ModulesDialog({
  opened,
  onClose,
  onAddModule,
  modules: availableModules,
  isLoading,
  selectedModules,
}: ModulesDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = availableModules
    ? availableModules.filter(
        (mod) =>
          mod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mod.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <Modal opened={opened} onClose={onClose} title='Select Module' size='lg'>
      <Stack>
        <TextInput
          placeholder='Search modules...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftSection={<IconSearch size='1rem' />}
        />

        <Paper style={{ maxHeight: '400px', overflow: 'auto' }}>
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
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={5} align='center'>
                    <Text>Loading modules...</Text>
                  </Table.Td>
                </Table.Tr>
              ) : filteredModules.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} align='center'>
                    <Text c='dimmed'>No modules found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredModules.map((module) => (
                  <Table.Tr key={module.id}>
                    <Table.Td>{module.code}</Table.Td>
                    <Table.Td>{module.name}</Table.Td>
                    <Table.Td>{module.type}</Table.Td>
                    <Table.Td>{module.credits}</Table.Td>
                    <Table.Td>
                      <Button
                        size='xs'
                        variant='light'
                        onClick={() => onAddModule(module)}
                        disabled={selectedModules.some(
                          (m) => m.id === module.id,
                        )}
                      >
                        {selectedModules.some((m) => m.id === module.id)
                          ? 'Added'
                          : 'Add'}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Modal>
  );
}
