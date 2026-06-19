import { parse as parse10 } from "./edition10.js";
import { parse as parse11 } from "./edition11.js";

const PARSERS = { "10": parse10, "11": parse11 };

export const getParser = (edition) => PARSERS[edition] ?? parse10;
