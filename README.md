# BluOS MCP Server

An MCP server to control [BluOS](https://bluos.net/) devices (Bluesound, NAD, etc.) using the `blu` CLI tool.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [`blu` CLI](https://github.com/steipete/blucli) installed locally

## Installation

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the server:
    ```bash
    npm run build
    ```

## Configuration

Add the server to your [Claude Desktop](https://claude.ai/download) configuration:

```json
{
  "mcpServers": {
    "blu": {
      "command": "node",
      "args": ["/path/to/blu-mcp/dist/index.js"],
      "env": {
        "BLU_CLI_PATH": "/path/to/your/blu/binary"
      }
    }
  }
}
```

-   `BLU_CLI_PATH` (optional): Path to your `blu` CLI binary. Defaults to `~/.local/bin/blu`.

## Features

-   **Playback Control:** Play, pause, stop, next, previous.
-   **Volume & Mute:** Get/set volume, mute/unmute.
-   **Status:** Get current track and device info.
-   **Tidal Integration:** Search and play directly from Tidal.
-   **Presets & Inputs:** List and load presets or switch inputs.
-   **Raw Commands:** Access any `blu` CLI command via the `raw` tool.

## Tools

-   `status`: Get playback status.
-   `playback`: Control playback actions.
-   `volume`: Get or set volume level.
-   `mute`: Control mute state.
-   `presets`: List or load presets.
-   `inputs`: List or select inputs.
-   `tidal`: Search and play Tidal content.
-   `raw`: Run arbitrary `blu` commands.

## License

ISC
