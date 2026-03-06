import { server } from "../src/index.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

describe("Blu MCP Server", () => {
  it("should list tools correctly", async () => {
    // @ts-ignore - access private request handlers for testing
    const handler = server._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
    const result = await handler({ method: ListToolsRequestSchema.shape.method.value });
    
    expect(result.tools).toBeDefined();
    const toolNames = result.tools.map((t: any) => t.name);
    expect(toolNames).toContain("status");
    expect(toolNames).toContain("playback");
    expect(toolNames).toContain("volume");
    expect(toolNames).toContain("mute");
    expect(toolNames).toContain("presets");
    expect(toolNames).toContain("inputs");
    expect(toolNames).toContain("tidal");
    expect(toolNames).toContain("raw");
  });
});
