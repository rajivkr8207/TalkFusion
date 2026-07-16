import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import open from "open";
import { exec } from "child_process";

const server = new McpServer({
  name: "Desktop Assistant",
  version: "1.0.0",
});

//
// GOOGLE SEARCH
//
server.tool(
  "google_search",
  "Search anything on Google",
  {
    query: z.string(),
  },
  async ({ query }) => {

    await open(
      `https://www.google.com/search?q=${encodeURIComponent(query)}`
    );

    return {
      content: [
        {
          type: "text",
          text: `Searching Google for "${query}"`,
        },
      ],
    };
  }
);

//
// PLAY ON YOUTUBE
//
server.tool(
  "play_youtube",
  "Play a song or video on YouTube",
  {
    query: z.string(),
  },
  async ({ query }) => {

    await open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        query
      )}`
    );

    return {
      content: [
        {
          type: "text",
          text: `Opening YouTube: ${query}`,
        },
      ],
    };
  }
);

//
// OPEN CAMERA (Windows)
//
server.tool(
  "open_camera",
  "Open Windows Camera",
  {},
  async () => {

    exec("start microsoft.windows.camera:");

    return {
      content: [
        {
          type: "text",
          text: "Opening Camera",
        },
      ],
    };
  }
);

//
// OPEN WEBSITE
//
server.tool(
  "open_website",
  "Open any website",
  {
    url: z.string(),
  },
  async ({ url }) => {

    let website = url;

    if (!website.startsWith("http")) {
      website = "https://" + website;
    }

    await open(website);

    return {
      content: [
        {
          type: "text",
          text: `Opening ${website}`,
        },
      ],
    };
  }
);

//
// OPEN APPLICATION
//
server.tool(
  "open_application",
  "Open installed applications",
  {
    app: z.string(),
  },
  async ({ app }) => {

    const apps = {
      chrome: `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`,
      vscode: `"C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"`,
      calculator: "calc",
      notepad: "notepad",
      paint: "mspaint",
      gta5: `"C:\\Program Files (x86)\\Steam\\steamapps\\common\\Grand Theft Auto V\\GTAVLauncher.exe"` || "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Grand Theft Auto V\\GTAVLauncher.exe" || "D:\\Games\\Grand Theft Auto V Legacy\\GTAVLauncher.exe",
      discord: `"C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\Discord.exe"`,

    };

    const command = apps[app.toLowerCase()];

    if (!command) {
      return {
        content: [
          {
            type: "text",
            text: "Unknown application.",
          },
        ],
      };
    }

    exec(`start "" ${command}`);

    return {
      content: [
        {
          type: "text",
          text: `Opening ${app}`,
        },
      ],
    };
  }
);

//
// GOOGLE MAPS
//
server.tool(
  "search_maps",
  "Search location in Google Maps",
  {
    location: z.string(),
  },
  async ({ location }) => {

    await open(
      `https://www.google.com/maps/search/${encodeURIComponent(location)}`
    );

    return {
      content: [
        {
          type: "text",
          text: `Opening Maps: ${location}`,
        },
      ],
    };
  }
);

//
// SPOTIFY
//
server.tool(
  "spotify_search",
  "Search song on Spotify",
  {
    song: z.string(),
  },
  async ({ song }) => {

    await open(
      `https://open.spotify.com/search/${encodeURIComponent(song)}`
    );

    return {
      content: [
        {
          type: "text",
          text: `Searching Spotify for ${song}`,
        },
      ],
    };
  }
);

//
// START SERVER
//
const transport = new StdioServerTransport();

await server.connect(transport);