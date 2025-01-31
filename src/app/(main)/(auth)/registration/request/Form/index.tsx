'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getSemesterModules } from '../actions';
import { createRegistrationWithModules } from '@/server/registration-requests/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  stdNo: number;
  structureId: number;
  semester: number;
};

const formSchema = z.object({
  modules: z.array(z.number()).min(1, {
    message: 'You must select at least one module.',
  }),
});

export default function RegisterForm({ stdNo, structureId, semester }: Props) {
  const { toast } = useToast();
  const { currentTerm } = useCurrentTerm();
  const router = useRouter();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['semesterModules', structureId, semester],
    queryFn: () => getSemesterModules(structureId, semester),
  });

  const { mutate: submitRegistration, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!modules) throw new Error('No modules available');
      if (!currentTerm) throw new Error('No current term found');

      return createRegistrationWithModules({
        stdNo,
        termId: currentTerm.id,
        moduleIds: values.modules.map((moduleId) => ({
          moduleId,
          moduleStatus: 'Compulsory' as const,
        })),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Registration submitted successfully',
        description: 'Your registration request is pending approval.',
      });
      router.push('/clearance/request');
    },
    onError: (error) => {
      toast({
        title: 'Error submitting registration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modules: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitRegistration(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between pb-4 border-b'>
            <h3 className='hidden sm:block text-lg font-semibold'>
              Available Modules
            </h3>
            <p className='text-sm text-muted-foreground'>
              Select the modules to register for
            </p>
          </div>

          <div className='space-y-4'>
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className='flex items-start gap-2 p-4'>
                    <Skeleton className='h-4 w-4 mt-1' />
                    <div className='space-y-2 flex-1'>
                      <Skeleton className='h-10 w-full' />
                      <Skeleton className='h-4 w-1/4' />
                    </div>
                  </div>
                ))
              : modules?.map((module) => (
                  <FormField
                    key={module.id}
                    control={form.control}
                    name='modules'
                    render={({ field }) => (
                      <FormItem className='relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring'>
                        <FormControl>
                          <Checkbox
                            className='order-1 after:absolute after:inset-0'
                            checked={field.value?.includes(module.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, module.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== module.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <div className='grid grow gap-1.5'>
                          <FormLabel className='text-base font-medium'>
                            {module.name}
                          </FormLabel>
                          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <span className='font-mono'>{module.code}</span>
                            <span>•</span>
                            <span className='capitalize'>{module.type}</span>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
          </div>
        </div>

        <div className='flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t'>
          <Button
            type='submit'
            size='lg'
            className='w-full sm:w-auto'
            disabled={isPending || isLoading}
          >
            {isPending ? 'Submitting...' : 'Register Selected Modules'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
