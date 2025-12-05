import { z } from "zod";
import { tool } from "ai";

const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY!;

const StockInput = z.object({
  symbol: z.string().describe("Ticker symbol like 'AAPL', 'TSLA'"),
});
export type StockInputType = z.infer<typeof StockInput>;

export const getStockPrice = tool({
  description: `
    Get real-time stock prices and market data for any company or ticker symbol.
    Use this tool when users ask about stock prices, share values, market data, or company performance.
    Examples: "What's Apple's stock price?", "How is Tesla doing?", "Get me MSFT stock info"
  `,

  inputSchema: StockInput,

  async execute({ symbol }) {
    const url = new URL("https://www.alphavantage.co/query");
    url.searchParams.set("function", "GLOBAL_QUOTE");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", ALPHAVANTAGE_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Stock API error");

    const json = await res.json();
    const quote = json["Global Quote"];

    if (!quote) {
      return { error: "No price found for this symbol." };
    }

    return {
      symbol,
      price: quote["05. price"],
      change: quote["09. change"],
      changePercent: quote["10. change percent"],
    };
  },
});
