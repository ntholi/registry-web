'use client';

import { StudentModuleStatus } from '@/db/schema';
import { getStructureModules } from '@/server/structures/actions';
import { Box, Paper } from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import { ModuleSearchInput } from './ModuleSearchInput';
import ModulesTable from './ModulesTable';

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type Student = {
  programs: Array<{
    semesters: Array<{
      studentModules: Array<{
        semesterModule: {
          module: {
            name: string;
          } | null;
        };
      }>;
    }>;
  }>;
};

interface ModuleSectionProps {
  availableModules: ModuleWithStatus[];
  setAvailableModules: (modules: ModuleWithStatus[]) => void;
  selectedModules: Set<number>;
  onModuleToggle: (moduleId: number) => void;
  onModulesChange: (
    modules: { moduleId: number; moduleStatus: StudentModuleStatus }[]
  ) => void;
  structureId?: number;
  student?: Student;
  error?: string;
}

export default function ModuleSection({
  availableModules,
  setAvailableModules,
  selectedModules,
  onModuleToggle,
  onModulesChange,
  structureId,
  student,
  error,
}: ModuleSectionProps) {
  const determineModuleStatus = (
    moduleData: Awaited<ReturnType<typeof getStructureModules>>[number],
    existingRepeatModules: ModuleWithStatus[]
  ): 'Compulsory' | 'Elective' | `Repeat${number}` => {
    if (!student)
      return moduleData.type === 'Elective' ? 'Elective' : 'Compulsory';

    const attemptedModules = student.programs
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .filter((m) => m.semesterModule.module?.name === moduleData.name);

    if (attemptedModules.length > 0) {
      const repeatCount =
        existingRepeatModules.filter(
          (m) => m.name === moduleData.name && m.status.includes('Repeat')
        ).length + 1;
      return `Repeat${repeatCount}` as const;
    }

    return moduleData.type === 'Elective' ? 'Elective' : 'Compulsory';
  };

  const handleAddModule = (
    moduleData: Awaited<ReturnType<typeof getStructureModules>>[number] | null
  ) => {
    if (!moduleData) return;

    const moduleStatus = determineModuleStatus(moduleData, availableModules);

    const newModule: ModuleWithStatus = {
      semesterModuleId: moduleData.semesterModuleId,
      code: moduleData.code || '',
      name: moduleData.name || '',
      type: moduleData.type,
      credits: moduleData.credits,
      status: moduleStatus,
      semesterNo: moduleData.semesterNumber,
      prerequisites: [],
    };

    const isAlreadyAvailable = availableModules.some(
      (m) => m.semesterModuleId === newModule.semesterModuleId
    );

    if (!isAlreadyAvailable) {
      const updatedModules = [...availableModules, newModule];
      setAvailableModules(updatedModules);

      // Auto-select the added module and update form
      const newSelected = new Set([
        ...selectedModules,
        newModule.semesterModuleId,
      ]);

      const selectedModulesList = updatedModules
        .filter((m) => newSelected.has(m.semesterModuleId))
        .map((m) => ({
          moduleId: m.semesterModuleId,
          moduleStatus: m.status.includes('Repeat')
            ? ('Repeat' as StudentModuleStatus)
            : ('Active' as StudentModuleStatus),
        }));

      onModulesChange(selectedModulesList);

      setTimeout(() => {
        onModuleToggle(newModule.semesterModuleId);
      }, 0);
    }
  };

  return (
    <>
      <Paper withBorder p='md'>
        <ModuleSearchInput
          label='Add Additional Module'
          placeholder='Search for modules by code or name'
          structureId={structureId || 0}
          value={null}
          onChange={() => {}}
          onModuleSelect={handleAddModule}
          disabled={!structureId}
        />
      </Paper>

      <Box>
        <ModulesTable
          modules={availableModules}
          selectedModules={selectedModules}
          onModuleToggle={onModuleToggle}
          error={error}
        />
      </Box>
    </>
  );
}
