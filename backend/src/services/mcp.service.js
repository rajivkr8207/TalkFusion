import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";


let client;

export const getMCPclient = async () => {
    const transport = new StdioClientTransport({
        command: "npm",
        args: ["start"],
    })
    client = new Client({
        name: "talk-fusion-client",
        version: "0.1.0",
    })
    await client.connect(transport);
    return client;
} 