import { getWeather } from "./weather.tool";
import { getStockPrice } from "./stock.tool";
import { getF1Matches } from "./f1.tool";

export const tools = {
  getWeather,
  getStockPrice,
  getF1Matches,
};

export type ToolName = keyof typeof tools;
