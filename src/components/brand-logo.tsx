import Image from "next/image";

export function BrandLogo({
  size = 42,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo/mark.png"
      alt=""
      width={size}
      height={size}
      className={`brand-logo ${className}`.trim()}
      unoptimized
    />
  );
}
