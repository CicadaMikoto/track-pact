export const repository='CicadaMikoto/track-pact';
export const repoUrl=`https://github.com/${repository}`;
export const sharedUrl=`https://raw.githubusercontent.com/${repository}/main/public/club.json`;
export type Operation={type:string;[key:string]:unknown};
export function requestUrl(title:string,operation:Operation){
 const payload={version:1,requestId:crypto.randomUUID(),...operation};
 const body=`Save this change to Track Pact. Click **Create** to send it. Only the repository owner and collaborators with write access can apply changes.\n\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`\n\nTrack Pact will close this request after saving. Return to the app and click Refresh shared.`;
 return `${repoUrl}/issues/new?${new URLSearchParams({title:`[Track Pact] ${title}`,body})}`;
}
export function same(a:unknown,b:unknown):boolean{function stable(v:unknown):unknown{if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));return v}return JSON.stringify(stable(a))===JSON.stringify(stable(b))}
