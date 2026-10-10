export function parseNutrition(data){
 if(Array.isArray(data))return data;
 if(typeof data!=='string')return [];
 return data.split('\n').slice(1).flatMap(line=>{const a=line.trim().split(',');if(a.length!==9)return [];const nums=a.slice(2).map(Number);if(nums.some(x=>!Number.isFinite(x)))return [];return [{name:a[0],kcal:nums[1],protein:nums[2],fat:nums[3],carbs:nums[4],sodium:nums[5]}]});
}
// Only punctuation normalization; no fuzzy matching of portions or similar products.
export const canonical=s=>String(s).normalize('NFKC').replace(/[\s（）()“”"·]/g,'');
export function matchNutrition(name,rows){const matches=rows.filter(x=>canonical(x.name)===canonical(name));if(!matches.length)return null;const signatures=new Set(matches.map(x=>JSON.stringify([x.kcal,x.protein,x.fat,x.carbs,x.sodium])));return signatures.size===1?matches[0]:null;}
export function normalizeMenu(data,nutrition){
 const tags=new Map();for(const c of data.categories||[])for(const m of c.meals||[])tags.set(m.code,{category:c.name,tags:m.tags||[]});
 return Object.entries(data.meals||{}).map(([code,m])=>{const p=Number(m.currentPrice);return {code,name:m.name,image:m.image,priceCents:Number.isFinite(p)&&p>0?Math.round(p*100):null,category:tags.get(code)?.category||'',tags:tags.get(code)?.tags||[],nutrition:matchNutrition(m.name,nutrition)}}).filter(m=>m.name&&m.priceCents&& !/卡|会员|餐具|酱包/.test(m.name));
}
const main=m=>/堡|麦满分|卷|巨无霸|麦香鸡|麦香鱼/.test(m.name)&& !/套餐|餐$|组合/.test(m.name);
const side=m=>/薯|玉米|鸡翅|麦乐鸡|鸡球|派|苹果/.test(m.name)&& !/套餐|组合/.test(m.name);
const drink=m=>/可乐|雪碧|茶|咖啡|牛奶|豆浆|纯悦|果汁|美式/.test(m.name)&& !/套餐|组合|卡/.test(m.name);
export function candidates(menu,{budget,people=1,preference='classic',exclude=''}){
 const cap=Math.round(Number(budget)*100);const omitted=String(exclude).split(/[,，、]/).map(x=>x.trim()).filter(Boolean);
 const eligible=menu.filter(m=>!omitted.some(x=>m.name.includes(x)) && !/套餐|组合|买一|加购|随单|精选|件套|随心|任选|乐园餐/.test(m.name));
 const top=(pred,n)=>eligible.filter(pred).sort((a,b)=>a.priceCents-b.priceCents).slice(0,n);
 const mains=top(main,18),sides=top(side,10),drinks=top(drink,8);
 const combos=[];
 for(const a of mains)for(const b of [null,...sides])for(const c of [null,...drinks]){
  const arr=[a,b,c].filter(Boolean);if(new Set(arr.map(x=>x.code)).size!==arr.length)continue;
  const items=arr.map((m,i)=>({...m,quantity:i===0?people:1}));const price=items.reduce((s,m)=>s+m.priceCents*m.quantity,0);if(price>cap)continue;
  const complete=items.every(m=>m.nutrition);const protein=complete?items.reduce((s,m)=>s+m.nutrition.protein*m.quantity,0):null;
  const variety=items.length;const liked=preference==='crispy'?arr.filter(m=>/脆|辣|鸡/.test(m.name)).length:preference==='fresh'?arr.filter(m=>/板烧|玉米|苹果|无糖/.test(m.name)).length:arr.filter(m=>/巨无霸|吉士|麦香|板烧/.test(m.name)).length;
  combos.push({items,estimatedCents:price,protein,kcal:complete?items.reduce((s,m)=>s+m.nutrition.kcal*m.quantity,0):null,scores:{taste:liked*10+variety*5-price/10000,protein:protein??-1,share:variety*10+Math.min(people,4)*2-price/10000}});
 }
 const used=new Set();return ['taste','protein','share'].map(strategy=>{const ranked=combos.filter(c=>strategy!=='protein'||c.protein!==null).sort((a,b)=>b.scores[strategy]-a.scores[strategy]||a.estimatedCents-b.estimatedCents);const pick=ranked.find(c=>!used.has(c.items.map(m=>m.code+':'+m.quantity).join('|')))||ranked[0];if(!pick)return {strategy,empty:true,reason:strategy==='protein'?'预算内没有营养信息完整匹配的组合。':'没有符合预算与条件的组合，请提高预算或减少人数。'};used.add(pick.items.map(m=>m.code+':'+m.quantity).join('|'));return {...pick,strategy}});
}
export function validateRequest(b){const budget=Number(b.budget),people=Number(b.people);if(!Number.isFinite(budget)||budget<1||budget>1000||!Number.isInteger(people)||people<1||people>6)throw new Error('预算须为1–1000元，人数须为1–6人。');if(!['classic','crispy','fresh'].includes(b.preference))throw new Error('口味条件无效。');if(typeof b.exclude!=='string'||b.exclude.length>80)throw new Error('排除关键词过长。');return {budget,people,preference:b.preference,exclude:b.exclude};}
