import { z } from "zod";
import { tool } from "ai";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!;

const WeatherInput = z.object({
  location: z.string().describe("City name like 'Delhi'"),
});
export type WeatherInputType = z.infer<typeof WeatherInput>;

export const getWeather = tool({
  description: `
    Get current weather conditions, temperature, and forecasts for any city or location.
    Use this tool when users ask about weather, temperature, climate, or forecasts.
    Examples: "What's the weather in London / Bangalore / Delhi ?", "How hot is it in Dubai?", "Is it raining in Paris?"
  `,

  inputSchema: WeatherInput,

  async execute({ location }) {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", location);
    url.searchParams.set("appid", OPENWEATHER_API_KEY);
    url.searchParams.set("units", "metric");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Weather API error");

    const data = await res.json();

    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: data.main.temp,
      condition: data.weather[0].description,
      humidity: data.main.humidity,
    };
  },
});
