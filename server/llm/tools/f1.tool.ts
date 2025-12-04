import { tool } from "ai";
import { z } from "zod";

const F1Input = z.object({});

export const getF1Matches = tool({
  description: `
    Fetch the *next* Formula 1 Grand Prix using the Jolpi Ergast Mirror API.
    Use this tool ONLY when the user asks about:
    - upcoming F1 race
    - next Formula 1 event
    - F1 schedule
    - next GP
  `,
  inputSchema: F1Input,

  async execute() {
    const url = "https://api.jolpi.ca/ergast/f1/current/next.json";

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch F1 race data. Status: ${res.status}`);
    }

    const data = await res.json();

    const race = data?.MRData?.RaceTable?.Races?.[0];
    if (!race) {
      return {
        message: "No upcoming Formula 1 race found.",
      };
    }

    return {
      raceName: race.raceName,
      season: race.season,
      round: race.round,
      date: race.date,
      time: race.time,

      circuit: {
        name: race.Circuit.circuitName,
        locality: race.Circuit.Location.locality,
        country: race.Circuit.Location.country,
        latitude: race.Circuit.Location.lat,
        longitude: race.Circuit.Location.long,
      },

      sessions: {
        firstPractice: race.FirstPractice,
        secondPractice: race.SecondPractice,
        thirdPractice: race.ThirdPractice,
        qualifying: race.Qualifying,
      },

      wikipediaUrl: race.url,
      circuitUrl: race.Circuit.url,
    };
  },
});
