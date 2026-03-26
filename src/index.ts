#!/usr/bin/env node
/**
 * NIC.cl MCP Server
 * 
 * Provides tools to interact with NIC Chile's registry for .cl domains.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Initialize the MCP server with name and version.
 */
const server = new Server(
  {
    name: "nic-cl-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool handlers implementation
 */

/**
 * Fetches recently registered .cl domains.
 * @param time Period to check (1h, 1d, 1w, 1m)
 */
async function handleLatestDomains(time: string = "hour") {
  let t = "1h";
  switch (time) {
    case "hour": t = "1h"; break;
    case "day": t = "1d"; break;
    case "week": t = "1w"; break;
    case "month": t = "1m"; break;
    default:
      throw new Error("Invalid time period. Use hour, day, week, or month.");
  }

  const url = `https://www.nic.cl/registry/Ultimos.do?t=${t}`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const domains = $(".tablabusqueda td div a")
    .map((_, a) => $(a).text())
    .get();

  return {
    content: [{ type: "text", text: JSON.stringify(domains, null, 2) }],
  };
}

/**
 * Searches for .cl domains based on a pattern.
 * @param q The search pattern (string)
 * @param filter Type of filter (exact match, starts with, contains)
 */
async function handleSearchDomains(q: string, filter: string = "exacta") {
  const url = "https://www.nic.cl/registry/BuscarDominio.do";
  const params = new URLSearchParams();
  params.append("buscar", "Buscar Dominio");
  params.append("filtro", filter);
  params.append("patron", q);

  const { data } = await axios.post(url, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  });

  const $ = cheerio.load(data);
  const domains = $(".tablabusqueda td div a")
    .map((_, a) => $(a).text())
    .get();

  return {
    content: [{ type: "text", text: JSON.stringify(domains, null, 2) }],
  };
}

/**
 * Retrieves WHOIS details for a specific .cl domain.
 * @param domain The domain name (e.g. google.cl)
 */
async function handleWhoisDomain(domain: string) {
  const url = `https://www.nic.cl/registry/Whois.do?d=${domain}`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const info = $(".tablabusqueda td")
    .map((_, e) => $("div", e).eq(1).text().trim())
    .get()
    .filter(Boolean);

  return {
    content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
  };
}

/**
 * Fetches recently deleted .cl domains.
 * @param time Period to check (day, week)
 */
async function handleDeletedDomains(time: string = "day") {
  let t = "1d";
  switch (time) {
    case "day": t = "1d"; break;
    case "week": t = "1s"; break;
    default:
      throw new Error("Invalid time period. Use day or week.");
  }

  const url = `https://www.nic.cl/registry/Eliminados.do?t=${t}`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const domains = $(".tablabusqueda td div")
    .map((_, a) => {
      const text = $(a).text().trim();
      return text !== "inscribir" ? text : null;
    })
    .get()
    .filter(Boolean);

  return {
    content: [{ type: "text", text: JSON.stringify(domains, null, 2) }],
  };
}

/**
 * Register available tools and their schemas.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_latest_domains",
        description: "Fetch recently registered .cl domains",
        inputSchema: {
          type: "object",
          properties: {
            time: {
              type: "string",
              enum: ["hour", "day", "week", "month"],
              default: "hour",
              description: "Time period (hour, day, week, month)",
            },
          },
        },
      },
      {
        name: "search_domains",
        description: "Search for .cl domains using a pattern",
        inputSchema: {
          type: "object",
          properties: {
            q: { type: "string", description: "Search pattern" },
            filter: {
              type: "string",
              enum: ["exacta", "comienza", "contiene"],
              default: "exacta",
              description: "Search filter (exacta: exact match, comienza: starts with, contiene: contains)",
            },
          },
          required: ["q"],
        },
      },
      {
        name: "whois_domain",
        description: "Get detailed WHOIS information for a .cl domain",
        inputSchema: {
          type: "object",
          properties: {
            domain: { type: "string", description: "Domain name (e.g. google.cl)" },
          },
          required: ["domain"],
        },
      },
      {
        name: "get_deleted_domains",
        description: "Fetch recently deleted .cl domains",
        inputSchema: {
          type: "object",
          properties: {
            time: {
              type: "string",
              enum: ["day", "week"],
              default: "day",
              description: "Time period (day, week)",
            },
          },
        },
      },
    ],
  };
});

/**
 * Handle tool execution requests.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_latest_domains":
        return await handleLatestDomains(args?.time as string);
      case "search_domains":
        return await handleSearchDomains(args?.q as string, args?.filter as string);
      case "whois_domain":
        return await handleWhoisDomain(args?.domain as string);
      case "get_deleted_domains":
        return await handleDeletedDomains(args?.time as string);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server using Stdio transport.
 */
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NIC.cl MCP server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
