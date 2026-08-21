"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/button";

interface CounterProps {
  initialValue?: number;
  className?: string;
}

// Contador simple: muestra el valor y permite incrementarlo y decrementarlo.
export function Counter({ initialValue = 0, className = "" }: CounterProps) {
  const [count, setCount] = useState(initialValue);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <PrimaryButton
        onClick={() => setCount((prev) => prev - 1)}
        fullWidth={false}
        className="px-5"
      >
        -
      </PrimaryButton>

      <span className="min-w-12 text-center text-3xl font-bold text-[#3F362E]">
        {count}
      </span>

      <PrimaryButton
        onClick={() => setCount((prev) => prev + 1)}
        fullWidth={false}
        className="px-5"
      >
        +
      </PrimaryButton>
    </div>
  );
}
