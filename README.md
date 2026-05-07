# NIC.cl MCP Server

A Model Context Protocol (MCP) server to query .cl domain information from [NIC Chile](https://www.nic.cl).

## Features

- **get_latest_domains**: Fetch recently registered domains (hour, day, week, month).
- **search_domains**: Search for .cl domains using patterns (exact, starts with, contains).
- **whois_domain**: Get detailed WHOIS information for a specific .cl domain.
- **get_deleted_domains**: Fetch recently deleted domains.

## Installation

### Using npx (recommended)

No installation needed. Use directly in your MCP client configuration:

1. Install global dependency
```bash
npm install -g @kattatzu/mcp-nic-cl
```

2. Configure MCP
```json
{
  "mcpServers": {
    "nic-cl": {
      "command": "npx",
      "args": ["-y", "@kattatzu/mcp-nic-cl"]
    }
  }
}
```

### From Source

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Add to your MCP client configuration:
   ```json
   {
     "mcpServers": {
       "nic-cl": {
         "command": "node",
         "args": ["/absolute/path/to/nic-cl-mcp/dist/index.js"]
       }
     }
   }
   ```

## Usage

### With MCP Inspector

You can test the server locally using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector npx @kattatzu/mcp-nic-cl
```

### In Claude Desktop or other MCP Clients

Add the following to your MCP settings configuration file:

```json
{
  "mcpServers": {
    "nic-cl": {
      "command": "npx",
      "args": ["-y", "@kattatzu/mcp-nic-cl"]
    }
  }
}
```

## Tools

### `get_latest_domains`
- **Arguments**:
  - `time` (optional): `"hour"`, `"day"`, `"week"`, `"month"`. Default: `"hour"`.

### `search_domains`
- **Arguments**:
  - `q` (required): Search pattern.
  - `filter` (optional): `"exacta"`, `"comienza"`, `"contiene"`. Default: `"exacta"`.

### `whois_domain`
- **Arguments**:
  - `domain` (required): The .cl domain to query.

### `get_deleted_domains`
- **Arguments**:
  - `time` (optional): `"day"`, `"week"`. Default: `"day"`.

## License

MIT
