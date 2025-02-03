'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleStatus } from '@/db/schema';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { useToast } from '@/hooks/use-toast';
import {
  getRegistrationRequestByStdNo,
  updateRegistrationWithModules,
} from '@/server/registration-requests/actions';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getSemesterModules } from '../request/actions';
import ModuleInput from '../request/Form/ModuleInput';

type Props = {
  stdNo: number;
  structureId: number;
  semester: number;
  request: NonNullable<
    Awaited<ReturnType<typeof getRegistrationRequestByStdNo>>
  >;
};

const formSchema = z.object({
  modules: z.array(z.number()).min(1, {
    message: 'You must select at least one module.',
  }),
});

export type UpdateFormSchema = z.infer<typeof formSchema>;

export default function ModulesForm({
  stdNo,
  structureId,
  semester,
  request,
}: Props) {
  const { toast } = useToast();
  const { currentTerm } = useCurrentTerm();
  const router = useRouter();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['semesterModules', structureId, semester],
    queryFn: () => getSemesterModules(stdNo, structureId, semester),
  });

  const form = useForm<UpdateFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modules: request.requestedModules
        .map((it) => it.module)
        .map((it) => it.id),
    },
  });

  const { mutate: submitUpdate, isPending } = useMutation({
    mutationFn: async (values: UpdateFormSchema) => {
      if (!modules) throw new Error('No modules available');
      if (!currentTerm) throw new Error('No current term found');

      const selectedModules = values.modules
        .map((moduleId) => {
          const found = modules.find((it) => it.id === moduleId);
          if (found) {
            return {
              id: found.id,
              status: 'Compulsory' as const,
            };
          }
        })
        .filter(Boolean) as { id: number; status: ModuleStatus }[];

      await updateRegistrationWithModules(request.id, selectedModules);
    },
    onSuccess: () => {
      toast({
        title: 'Registration updated successfully',
        description: 'Your registration has been updated.',
      });
      router.push('/registration');
    },
    onError: (error) => {
      toast({
        title: 'Error updating registration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: UpdateFormSchema) {
    submitUpdate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='space-y-4'>
          <div className='pb-4 border-b'>
            <h3 className='hidden sm:block text-lg font-semibold'>
              Requested Modules
            </h3>
          </div>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className='space-y-4'>
              {modules?.map((module) => (
                <ModuleInput
                  key={module.id}
                  control={form.control}
                  module={module}
                />
              ))}
            </div>
          )}
        </div>

        <div className='flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t'>
          <Button
            type='submit'
            size='lg'
            className='w-full sm:w-auto'
            disabled={isPending || isLoading}
          >
            {isPending ? 'Updating...' : 'Update Registration'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className='flex items-start gap-2 p-4'>
          <Skeleton className='h-4 w-4 mt-1' />
          <div className='space-y-2 flex-1'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-4 w-1/4' />
          </div>
        </div>
      ))}
    </>
  );
}
