"use client";
import { Suspense } from "react";
import updateAccount from "@/src/lib/model/account/mutations/updateAccount";
import getAccount from "@/src/lib/model/account/queries/getAccount";
import { UpdateAccountSchema } from "../schemas";
import { FORM_ERROR, AccountForm } from "./AccountForm";
import { useMutation, useQuery } from "@blitzjs/rpc";
import { useRouter } from "next/navigation";

export const EditAccount = ({ accountId }: { accountId: number }) => {
  const [account, { setQueryData }] = useQuery(
    getAccount,
    { id: accountId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  );
  const [updateAccountMutation] = useMutation(updateAccount);
  const router = useRouter();
  return (
    <>
      <div>
        <h1>Edit Account {account.id}</h1>
        <pre>{JSON.stringify(account, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <AccountForm
            submitText="Update Account"
            schema={UpdateAccountSchema}
            initialValues={account}
            onSubmit={async (values) => {
              try {
                const updated = await updateAccountMutation({
                  ...values,
                  id: account.id,
                });
                await setQueryData(updated);
                router.refresh();
              } catch (error: any) {
                console.error(error);
                return {
                  [FORM_ERROR]: error.toString(),
                };
              }
            }}
          />
        </Suspense>
      </div>
    </>
  );
};
