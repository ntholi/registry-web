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
import { getFailedPrerequisites, getSemesterModules } from '../request/actions';
import ModuleInput from '../request/Form/ModuleInput';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['semesterModules', structureId, semester],
    queryFn: () => getSemesterModules(stdNo, semester, structureId),
  });

  const { data: failedPrerequisites, isLoading: prerequisitesLoading } =
    useQuery({
      queryKey: ['failedPrerequisites', stdNo],
      queryFn: () => getFailedPrerequisites(stdNo, semester, structureId),
    });

  const isLoading = modulesLoading || prerequisitesLoading;

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
      <form className='space-y-6'>
        <div className='space-y-4'>
          <div className='border-b pb-4'>
            <h3 className='hidden text-lg font-semibold sm:block'>
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
                  failedPrerequisites={failedPrerequisites?.[module.code] || []}
                />
              ))}
            </div>
          )}
        </div>

        <div className='flex flex-col justify-end gap-4 border-t pt-4 sm:flex-row'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type='button'
                size='lg'
                className='w-full sm:w-auto'
                disabled={isPending || isLoading}
              >
                {isPending ? 'Updating...' : 'Update Registration'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Registration Update</AlertDialogTitle>
                <AlertDialogDescription>
                  Updating your registration might resend a registration
                  clearance request to the finance department. Are you sure you
                  want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={form.handleSubmit(onSubmit)}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
          <Skeleton className='mt-1 h-4 w-4' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-4 w-1/4' />
          </div>
        </div>
      ))}
    </>
  );
}
