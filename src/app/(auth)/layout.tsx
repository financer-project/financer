const AuthLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
    <div className={"md:px-0 px-4"}>
        {children}
    </div>
)

export default AuthLayout