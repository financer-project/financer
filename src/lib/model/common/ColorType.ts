enum ColorType {
    SLATE = "slate",
    GRAY = "gray",
    ZINC = "zinc",
    NEUTRAL = "neutral",
    STONE = "stone",
    RED = "red",
    ORANGE = "orange",
    AMBER = "amber",
    YELLOW = "yellow",
    LIME = "lime",
    GREEN = "green",
    EMERALD = "emerald",
    TEAL = "teal",
    CYAN = "cyan",
    SKY = "sky",
    BLUE = "blue",
    INDIGO = "indigo",
    VIOLET = "violet",
    PURPLE = "purple",
    FUCHSIA = "fuchsia",
    PINK = "pink",
    ROSE = "rose",
    WHITE = "white",
    BLACK = "black",
}

export const colors = `
    bg-slate-500
    bg-gray-500
    bg-zinc-500
    bg-neutral-500
    bg-stone-500
    bg-red-500
    bg-orange-500
    bg-amber-500
    bg-yellow-500
    bg-lime-500
    bg-green-500
    bg-emerald-500
    bg-teal-500
    bg-cyan-500
    bg-sky-500
    bg-blue-500
    bg-indigo-500
    bg-violet-500
    bg-purple-500
    bg-fuchsia-500
    bg-pink-500
    bg-rose-500
    bg-slate-100
    bg-gray-100
    bg-zinc-100
    bg-neutral-100
    bg-stone-100
    bg-red-100
    bg-orange-100
    bg-amber-100
    bg-yellow-100
    bg-lime-100
    bg-green-100
    bg-emerald-100
    bg-teal-100
    bg-cyan-100
    bg-sky-100
    bg-blue-100
    bg-indigo-100
    bg-violet-100
    bg-purple-100
    bg-fuchsia-100
    bg-pink-100
    bg-rose-100
`

export function getDefaultColor() {
    return ColorType.WHITE
}

export function getBackgroundColorLight(color?: ColorType | string | null) {
    return `bg-${color ?? getDefaultColor()}-100`
}

export function getBackgroundColor(color?: ColorType | string | null) {
    return `bg-${color ?? getDefaultColor()}-500`
}

export default ColorType