'use client';

import { Select, Group, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconBuilding, IconSchool, IconList } from '@tabler/icons-react';
import {
  getSchools,
  getProgramsBySchool,
  getStructuresByProgram,
} from '@/server/modules/actions';

interface FilterSelectProps {
  onStructureSelect: (structureId: number) => void;
}

export default function FilterSelect({ onStructureSelect }: FilterSelectProps) {
  const [schools, setSchools] = useState<{ value: string; label: string }[]>(
    []
  );
  const [programs, setPrograms] = useState<{ value: string; label: string }[]>(
    []
  );
  const [structures, setStructures] = useState<
    { value: string; label: string }[]
  >([]);

  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadSchools = async () => {
      const schoolData = await getSchools();
      setSchools(
        schoolData.map((school) => ({
          value: school.id.toString(),
          label: `${school.code} - ${school.name}`,
        }))
      );
    };
    loadSchools();
  }, []);

  useEffect(() => {
    const loadPrograms = async () => {
      if (selectedSchool) {
        const programData = await getProgramsBySchool(parseInt(selectedSchool));
        setPrograms(
          programData.map((program) => ({
            value: program.id.toString(),
            label: `${program.code} - ${program.name}`,
          }))
        );
        setSelectedProgram(null);
        setSelectedStructure(null);
      } else {
        setPrograms([]);
      }
    };
    loadPrograms();
  }, [selectedSchool]);

  useEffect(() => {
    const loadStructures = async () => {
      if (selectedProgram) {
        const structureData = await getStructuresByProgram(
          parseInt(selectedProgram)
        );
        setStructures(
          structureData.map((structure) => ({
            value: structure.id.toString(),
            label: structure.code,
          }))
        );
        setSelectedStructure(null);
      } else {
        setStructures([]);
      }
    };
    loadStructures();
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedStructure) {
      onStructureSelect(parseInt(selectedStructure));
    }
  }, [selectedStructure, onStructureSelect]);

  return (
    <Stack gap='md'>
      <Group grow>
        <Select
          label='School'
          placeholder='Select a school'
          data={schools}
          value={selectedSchool}
          onChange={setSelectedSchool}
          searchable
          clearable
          leftSection={<IconBuilding size={16} />}
          styles={{
            input: {
              '&:focus': {
                borderColor: 'var(--mantine-color-blue-5)',
              },
            },
          }}
        />
        <Select
          label='Program'
          placeholder='Select a program'
          data={programs}
          value={selectedProgram}
          onChange={setSelectedProgram}
          searchable
          clearable
          disabled={!selectedSchool}
          leftSection={<IconSchool size={16} />}
          styles={{
            input: {
              '&:focus': {
                borderColor: 'var(--mantine-color-blue-5)',
              },
            },
          }}
        />
        <Select
          label='Structure'
          placeholder='Select a structure'
          data={structures}
          value={selectedStructure}
          onChange={setSelectedStructure}
          searchable
          clearable
          disabled={!selectedProgram}
          leftSection={<IconList size={16} />}
          styles={{
            input: {
              '&:focus': {
                borderColor: 'var(--mantine-color-blue-5)',
              },
            },
          }}
        />
      </Group>
    </Stack>
  );
}
