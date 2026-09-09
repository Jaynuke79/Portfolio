import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}

export default function Reveal({ children, className, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"pending" | "visible">("pending");

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setState("visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} data-reveal={state} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}
