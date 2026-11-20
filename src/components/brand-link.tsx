import Image from "next/image";
import Link from "next/link";

type BrandLinkProps = {
  className: string;
};

export function BrandLink({ className }: BrandLinkProps) {
  return (
    <Link className={`brand-lockup ${className}`} href="/" aria-label="SpaciMore home">
      <Image
        className="brand-lockup-icon"
        src="/spacimore-icon.png"
        alt=""
        width={726}
        height={687}
      />
      <Image
        className="brand-lockup-wordmark"
        src="/spacimore-wordmark.png"
        alt="SpaciMore"
        width={1767}
        height={323}
      />
    </Link>
  );
}
