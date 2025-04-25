

export const Title = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h1 className={`scroll-m-20 text-4xl font-extrabold tracking-tight ${className ?? ""}`}>
        {children}
    </h1>
)

export const SubTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <p className={`text-sm text-muted-foreground mt-1 ${className ?? ""}`}>
        {children}
    </p>
)


export const Heading1 = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h1 className={`text-2xl font-semibold leading-none tracking-tight ${className ?? ""}`}>
        {children}
    </h1>
)

export const Heading2 = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h2 className={`text-xl font-semibold leading-none tracking-tight ${className ?? ""}`}>
        {children}
    </h2>
)

export const Heading3 = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h2 className={`text-l font-semibold leading-none tracking-tight ${className ?? ""}`}>
        {children}
    </h2>
)