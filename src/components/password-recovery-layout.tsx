import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PasswordRecoveryHeader() {
  return (
    <>
      <header className="password-reset-header">
        <Link aria-label="Back to login" className="signin-back" href="/login">
          <ChevronLeft aria-hidden="true" size={23} />
        </Link>
        <Image alt="MarketPlace: Shop, Sell, Grow" className="password-reset-logo" height={110} src="/header.png" width={344} />
      </header>
      <Image alt="" aria-hidden="true" className="password-reset-art" height={191} priority src="/forget%20icon.png" width={315} />
    </>
  );
}

export function PasswordRecoveryLinks() {
  return (
    <>
      <Link className="password-reset-back" href="/login">Back to Login</Link>
      <p className="password-reset-support">Need Help? <Link href="/support">Contact Support</Link></p>
    </>
  );
}
