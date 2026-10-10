import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const allowed=new Set(['query-nearby-stores','query-meals','query-meal-detail','list-nutrition-foods','calculate-price']);
let connection;
export function unwrap(r){
 if(r.isError)throw new Error('麦当劳工具返回错误，请重试或检查账户权限。');
 let v=r.structuredContent;
 if(!v){const t=(r.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');const s=t.includes('## Original Response')?t.slice(t.indexOf('## Original Response')):t;try{v=JSON.parse(s.slice(s.indexOf('{')))}catch{throw new Error('接口返回格式暂不支持。')}}
 if(v.success===false || (v.code!=null && ![0,200].includes(Number(v.code))))throw new Error(v.message||'麦当劳接口暂不可用。');
 return v;
}
async function connect(){if(!process.env.MCD_MCP_TOKEN)throw new Error('未配置 MCD_MCP_TOKEN，请使用示例模式或设置本地环境变量。');const c=new Client({name:'mcd-combo-lab',version:'1.0.0'});await c.connect(new StreamableHTTPClientTransport(new URL('https://mcp.mcd.cn'),{requestInit:{headers:{Authorization:`Bearer ${process.env.MCD_MCP_TOKEN}`}}}));return c;}
export async function call(name,args){if(!allowed.has(name))throw new Error('本项目仅允许查询与核价工具。');connection??=connect().catch(e=>{connection=undefined;throw e});const c=await connection;return unwrap(await c.callTool({name,arguments:args},undefined,{timeout:45000}));}
