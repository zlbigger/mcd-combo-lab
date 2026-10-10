import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {writeFile} from 'node:fs/promises';
const c=new Client({name:'combo-lab-discovery',version:'1.0.0'});
try {
await c.connect(new StreamableHTTPClientTransport(new URL('https://mcp.mcd.cn'),{requestInit:{headers:{Authorization:`Bearer ${process.env.MCD_MCP_TOKEN}`}}}));
const {tools}=await c.listTools();
const selected=tools.filter(t=>['query-nearby-stores','query-meals','query-meal-detail','calculate-price','list-nutrition-foods','query-store-coupons'].includes(t.name));
await writeFile('.private/tools.json',JSON.stringify(selected,null,2));
console.log(JSON.stringify(selected,null,2));
const n=await c.callTool({name:'list-nutrition-foods',arguments:{}});
await writeFile('.private/nutrition.json',JSON.stringify(n,null,2));
console.log('NUTRITION',JSON.stringify(n).slice(0,7000));
} catch(e){console.error(e.message)} finally{await c.close()}
