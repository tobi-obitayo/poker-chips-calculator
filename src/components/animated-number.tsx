"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

export function AnimatedNumber({
  value,
  format = (next) => Math.round(next).toString(),
  className,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const spring = useSpring(value, { stiffness: 90, damping: 20, mass: 0.8 });
  const display = useTransform(spring, (next) => format(next));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
