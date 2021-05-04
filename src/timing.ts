import { config } from "./config"

const defaultWidth = 35
const defaultChar = "."
export const time = (label: string, padWidth = defaultWidth, padChar = defaultChar) => {
    if (config.isTimed) {
        console.time(label.padEnd(padWidth, padChar))
    }
}

export const timeEnd = (label: string, padWidth = defaultWidth, padChar = defaultChar) => {
    if (config.isTimed) {
        console.timeEnd(label.padEnd(padWidth, padChar))
    }
}