import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountsList } from "./components/AccountsList";

export const metadata: Metadata = {
  title: "Accounts",
  description: "List of accounts",
};

export default function Page() {
  return (
    <div>
      <p>
        <Link href={"/accounts/new"}>Create Account</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <AccountsList />
      </Suspense>
    </div>
  );
}
