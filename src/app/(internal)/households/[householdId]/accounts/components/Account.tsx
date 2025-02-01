"use client";
import { useMutation, useQuery } from "@blitzjs/rpc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import deleteAccount from "@/src/lib/model/account/mutations/deleteAccount";
import getAccount from "@/src/lib/model/account/queries/getAccount";

export const Account = ({ accountId }: { accountId: number }) => {
  const router = useRouter();
  const [deleteAccountMutation] = useMutation(deleteAccount);
  const [account] = useQuery(getAccount, { id: accountId });

  return (
    <>
      <div>
        <h1>Project {account.id}</h1>
        <pre>{JSON.stringify(account, null, 2)}</pre>

        <Link href={`/accounts/${account.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteAccountMutation({ id: account.id });
              router.push("/accounts");
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>
      </div>
    </>
  );
};
