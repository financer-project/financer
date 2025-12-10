import { FormatterBase } from "@/src/lib/util/formatter/Formatter"

type User = { firstName: string, lastName: string }

export default class UserFormatter extends FormatterBase<User, string> {
    format(user: User): string {
        return `${user.firstName} ${user.lastName}`
    }
}