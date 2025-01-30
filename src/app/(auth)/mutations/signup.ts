import db from "db"
import { SecurePassword } from "@blitzjs/auth/secure-password"

export default async function signup(
  input: {
    firstName: string
    lastName: string
    password: string
    email: string
  },
  ctx: any,
) {
  const blitzContext = ctx
  const hashedPassword = await SecurePassword.hash(input.password)
  const user = await db.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      hashedPassword: hashedPassword,
    },
  })

  await blitzContext.session.$create({
    userId: user.id,
    role: "user",
  })

  return { userId: blitzContext.session.userId, ...user, email: input.email }
}
