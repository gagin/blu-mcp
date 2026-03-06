import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import path from "path";

const execFileAsync = promisify(execFile);
const BLU_PATH = process.env.BLU_CLI_PATH || path.join(homedir(), ".local", "bin", "blu");

async function runBlu(args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(BLU_PATH, args);
    return { stdout, stderr };
  } catch (error: any) {
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || error.message,
    };
  }
}

const server = new Server(
  {
    name: "blu-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "status",
        description: "Get current playback status, including track info and volume.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "playback",
        description: "Control playback (play, pause, stop, next, prev).",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["play", "pause", "stop", "next", "prev"],
              description: "Playback action to perform.",
            },
          },
          required: ["action"],
        },
      },
      {
        name: "volume",
        description: "Get or set volume.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["get", "set", "up", "down"],
              description: "Volume action to perform.",
            },
            level: {
              type: "number",
              description: "Volume level (0-100) for 'set' action.",
            },
          },
          required: ["action"],
        },
      },
      {
        name: "mute",
        description: "Control mute state.",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              enum: ["on", "off", "toggle"],
              description: "Mute state or toggle.",
            },
          },
          required: ["state"],
        },
      },
      {
        name: "presets",
        description: "List or load presets.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["list", "load"],
              description: "Preset action to perform.",
            },
            id: {
              type: "string",
              description: "Preset ID to load (e.g., '1', '+1', '-1').",
            },
          },
          required: ["action"],
        },
      },
      {
        name: "inputs",
        description: "List or select inputs.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["list", "play"],
              description: "Input action to perform.",
            },
            id: {
              type: "string",
              description: "Input ID to play.",
            },
          },
          required: ["action"],
        },
      },
      {
        name: "tidal",
        description: "Search and play music from Tidal.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["search", "play"],
              description: "Action to perform.",
            },
            query: {
              type: "string",
              description: "Search query (for 'search' or 'play').",
            },
            id: {
              type: "string",
              description: "Tidal playlist/album/track ID to play directly.",
            },
          },
          required: ["action"],
        },
      },
      {
        name: "raw",
        description: "Run a raw BluOS CLI command.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The blu command (e.g., 'shuffle on').",
            },
          },
          required: ["command"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "status": {
        const { stdout } = await runBlu(["status"]);
        return { content: [{ type: "text", text: stdout }] };
      }
      case "playback": {
        const { action } = args as { action: string };
        const { stdout } = await runBlu([action]);
        return { content: [{ type: "text", text: stdout }] };
      }
      case "volume": {
        const { action, level } = args as { action: string; level?: number };
        const bluArgs = ["volume", action];
        if (action === "set" && level !== undefined) {
          bluArgs.push(level.toString());
        }
        const { stdout } = await runBlu(bluArgs);
        return { content: [{ type: "text", text: stdout }] };
      }
      case "mute": {
        const { state } = args as { state: string };
        const { stdout } = await runBlu(["mute", state]);
        return { content: [{ type: "text", text: stdout }] };
      }
      case "presets": {
        const { action, id } = args as { action: string; id?: string };
        const bluArgs = ["presets", action];
        if (action === "load" && id) {
          bluArgs.push(id);
        }
        const { stdout } = await runBlu(bluArgs);
        return { content: [{ type: "text", text: stdout }] };
      }
      case "inputs": {
        const { action, id } = args as { action: string; id?: string };
        const bluArgs = ["inputs"];
        if (action === "play" && id) {
          bluArgs.push("play", id);
        }
        const { stdout } = await runBlu(bluArgs);
        return { content: [{ type: "text", text: stdout }] };
      }
      case "tidal": {
        const { action, query, id } = args as { action: string; query?: string; id?: string };
        if (action === "search") {
          if (!query) throw new Error("Search query required.");
          const { stdout } = await runBlu(["browse", "--key", "Tidal:Search", "--q", query]);
          return { content: [{ type: "text", text: stdout }] };
        } else if (action === "play") {
          if (id) {
            const { stdout } = await runBlu(["raw", "/Load", "--param", "service=Tidal", "--param", `id=${id}`]);
            return { content: [{ type: "text", text: stdout }] };
          } else if (query) {
            // Very simple search-and-play-first-result
            const { stdout } = await runBlu(["browse", "--key", "Tidal:Search", "--q", query]);
            // Extract the first playURL or id if possible? 
            // For now, let's just use the raw command with id if we had it.
            // Since we can't easily parse stdout here without more logic, 
            // let's just suggest using search first.
            return { content: [{ type: "text", text: "Searching and playing from Tidal via query is not yet automated. Please 'search' first and then 'play' with the specific ID." }] };
          }
          throw new Error("Tidal ID or search query required for play.");
        }
        throw new Error(`Unknown tidal action: ${action}`);
      }
      case "raw": {
        const { command } = args as { command: string };
        const bluArgs = command.split(" ");
        const { stdout } = await runBlu(bluArgs);
        return { content: [{ type: "text", text: stdout }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Blu MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
