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
    bg-slate-700
    bg-gray-700
    bg-zinc-700
    bg-neutral-700
    bg-stone-700
    bg-red-700
    bg-orange-700
    bg-amber-700
    bg-yellow-700
    bg-lime-700
    bg-green-700
    bg-emerald-700
    bg-teal-700
    bg-cyan-700
    bg-sky-700
    bg-blue-700
    bg-indigo-700
    bg-violet-700
    bg-purple-700
    bg-fuchsia-700
    bg-pink-700
    bg-rose-700
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
    return `bg-${color ?? getDefaultColor()}-700`
}

export default ColorType