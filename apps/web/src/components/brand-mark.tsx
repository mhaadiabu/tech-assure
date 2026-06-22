import Image from "next/image";

type BrandMarkProps = {
  size?: number;
  className?: string;
};

export function BrandMark({ size = 24, className }: BrandMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt="TechAssure"
      width={size}
      height={size}
      priority
      className={"dark:invert " + (className ?? "h-6 w-6")}
    />
  );
}
