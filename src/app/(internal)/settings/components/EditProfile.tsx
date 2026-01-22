"use client"

import { Suspense } from "react"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import getProfile from "@/src/lib/model/user/queries/getProfile"
import updateProfile from "@/src/lib/model/user/mutations/updateProfile"
import deleteAvatar from "@/src/lib/model/user/mutations/deleteAvatar"
import { ProfileForm } from "./ProfileForm"
import { AvatarUpload } from "./AvatarUpload"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { UpdateProfileSchema } from "@/src/lib/model/user/schemas"
import Section from "@/src/lib/components/common/structure/Section"
import { ChangePasswordDialog } from "@/src/app/(internal)/settings/components/ChangePasswordDialog"

export function EditProfile() {
    const [profile, { refetch }] = useQuery(getProfile, null, { staleTime: Infinity })
    const [updateProfileMutation] = useMutation(updateProfile)
    const [deleteAvatarMutation] = useMutation(deleteAvatar)
    const router = useRouter()

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Section title={"Profile"} subtitle={"Edit your profile information"} className={"mt-0"}>
                <div className={"flex lg:flex-row flex-col gap-8 items-start"}>
                    <div className={"lg:w-1/3 w-full"}>
                        <AvatarUpload
                            userId={profile.id}
                            firstName={profile.firstName}
                            lastName={profile.lastName}
                            hasAvatar={profile.hasAvatar}
                            onUpload={async () => {
                                await refetch()
                                router.refresh()
                            }}
                            onDelete={async () => {
                                await deleteAvatarMutation()
                                await refetch()
                                router.refresh()
                            }} />
                    </div>

                    <div className={"md:flex-1 w-full"}>
                        <ProfileForm
                            submitText={"Save Changes"}
                            schema={UpdateProfileSchema}
                            initialValues={{
                                firstName: profile.firstName,
                                lastName: profile.lastName,
                                email: profile.email
                            }}
                            onSubmit={async (values) => {
                                try {
                                    await updateProfileMutation(values)
                                    await refetch()
                                    router.refresh()
                                } catch (error: unknown) {
                                    const message = error instanceof Error ? error.message : String(error)
                                    return { [FORM_ERROR]: message }
                                }
                            }}
                        />
                    </div>
                </div>
            </Section>

            {profile.hasPassword && (
                <Section title={"Security"}
                         subtitle={"Update your password to keep your account secure."}>
                    <ChangePasswordDialog onSuccess={() => router.refresh()} />
                </Section>
            )}

        </Suspense>
    )
}
