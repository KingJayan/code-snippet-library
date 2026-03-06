import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useQueryState(key: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key) ?? "";

  const setValue = useCallback(
    (newValue: string) => {
      const params = new URLSearchParams(searchParams);

      if (newValue) {
        params.set(key, newValue);
      } else {
        params.delete(key);
      }

      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [key, pathname, router, searchParams]
  );

  return [value, setValue] as const;
}
