import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getAccount from "@/src/lib/model/account/queries/getAccount";
import { Account } from "../components/Account";

export async function generateMetadata(
  props: AccountPageProps
): Promise<Metadata> {
  const params = await props.params;
  const Account = await invoke(getAccount, { id: Number(params.accountId) });
  return {
    title: `Account ${Account.id} - ${Account.name}`,
  };
}

type AccountPageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function Page(props: AccountPageProps) {
  const params = await props.params;
  return (
    <div>
      <p>
        <Link href={"/accounts"}>Accounts</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <Account accountId={Number(params.accountId)} />
      </Suspense>
    </div>
  );
}
