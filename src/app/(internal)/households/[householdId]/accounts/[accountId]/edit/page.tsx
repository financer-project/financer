import { Metadata } from "next";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getAccount from "@/src/lib/model/account/queries/getAccount";
import { EditAccount } from "../../components/EditAccount";

type EditAccountPageProps = {
  params: Promise<{ accountId: string }>;
};

export async function generateMetadata(
  props: EditAccountPageProps
): Promise<Metadata> {
  const params = await props.params;
  const Account = await invoke(getAccount, { id: Number(params.accountId) });
  return {
    title: `Edit Account ${Account.id} - ${Account.name}`,
  };
}

export default async function Page(props: EditAccountPageProps) {
  const params = await props.params;
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditAccount accountId={Number(params.accountId)} />
      </Suspense>
    </div>
  );
}
