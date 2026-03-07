"use client";

import { useRouter } from "next/navigation";

type NavigateOptions = {
  replace?: boolean;
};

export function useNavigate() {
  const router = useRouter();

  function goto(path: string, options?: NavigateOptions) {
    if (options?.replace) {
      router.replace(path);
      return;
    }

    router.push(path);
  }

  return { goto };
}
