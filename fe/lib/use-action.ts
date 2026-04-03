import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "@/lib/toast";

interface Options<TData, TVariables> {
  mutationFn: (vars: TVariables) => Promise<TData>;
  successMessage?: string;
  errorMessage?: string;
  invalidateKeys?: string[][];
  onSuccess?: (data: TData) => void;
}

export function useActionMutation<TData = any, TVariables = void>(opts: Options<TData, TVariables>) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: opts.mutationFn,
    onSuccess: (data) => {
      if (opts.successMessage) toast.success(opts.successMessage);
      if (opts.invalidateKeys) {
        opts.invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      }
      opts.onSuccess?.(data);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || opts.errorMessage || "Terjadi kesalahan";
      toast.error(msg);
    },
  });
}
