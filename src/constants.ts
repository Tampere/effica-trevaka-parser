import { EfficaApplicationType } from "./types/effica";
import { EvakaApplicationType } from "./types/evaka";

export const APPLICATION_TYPE_MAP: Record<
    EfficaApplicationType,
    EvakaApplicationType
> = {
    BOA: "DAYCARE",
    BOK: "CLUB",
    PRO: "DAYCARE",
};
