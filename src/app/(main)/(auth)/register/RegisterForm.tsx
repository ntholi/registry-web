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
import { ScrollArea } from '@/components/ui/scroll-area';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getSemesterModules } from './actions';

type Props = {
  structureId: number;
  semester: number;
};

const formSchema = z.object({
  modules: z.array(z.string()).min(1, {
    message: 'You must select at least one module.',
  }),
});

export default function RegisterForm({ structureId, semester }: Props) {
  const { data: modules } = useQuery({
    queryKey: ['semesterModules', structureId, semester],
    queryFn: () => getSemesterModules(structureId, semester),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modules: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between pb-4 border-b'>
            <h3 className='text-lg font-semibold'>Available Modules</h3>
            <p className='text-sm text-muted-foreground'>
              Select the modules you wish to register for
            </p>
          </div>

          <ScrollArea className='h-[400px] pr-4'>
            <div className='space-y-4'>
              {modules?.map((module) => (
                <FormField
                  key={module.code}
                  control={form.control}
                  name='modules'
                  render={({ field }) => (
                    <FormItem className='flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors'>
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(module.code)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, module.code])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== module.code
                                  )
                                );
                          }}
                        />
                      </FormControl>
                      <div className='flex-1 space-y-1'>
                        <FormLabel className='text-base font-medium cursor-pointer'>
                          {module.name}
                        </FormLabel>
                        <div className='flex items-center space-x-2'>
                          <span className='text-sm font-mono text-muted-foreground'>
                            {module.code}
                          </span>
                          <span className='text-sm text-muted-foreground'>
                            •
                          </span>
                          <span className='text-sm capitalize text-muted-foreground'>
                            {module.type}
                          </span>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className='flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t'>
          <Button type='submit' size='lg' className='w-full sm:w-auto'>
            Register Selected Modules
          </Button>
        </div>
      </form>
    </Form>
  );
}
