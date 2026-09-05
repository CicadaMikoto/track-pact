import fs from 'node:fs/promises';
import {applyOperation,parseRequest,isAuthorized} from './operations.mjs';
const event=JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
const repository=process.env.GITHUB_REPOSITORY;
const issueNumber=event.issue?.number;
if(!issueNumber||!event.issue.title.startsWith('[Track Pact] '))process.exit(0);
const token=process.env.GITHUB_TOKEN;
async function api(path,method='GET',body){const r=await fetch(`https://api.github.com${path}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok){const error=Error(`GitHub request failed (${r.status}).`);error.status=r.status;throw error}return r.status===204?null:r.json()}
// The request body is data only. Never execute it, interpolate it into a shell,
// or check out a branch supplied by the issue author.
const issue=await api(`/repos/${repository}/issues/${issueNumber}`);
if(issue.state==='closed')process.exit(0);
let authorized=false;
try{const result=await api(`/repos/${repository}/collaborators/${encodeURIComponent(issue.user.login)}/permission`);authorized=isAuthorized(result.permission)}catch{}
if(!authorized){await api(`/repos/${repository}/issues/${issueNumber}`,'PATCH',{state:'closed',state_reason:'not_planned'});console.log('Ignored a request from an account without repository write access.');process.exit(0)}
try{
 const operation=parseRequest(issue.body);let applied=false;
 for(let attempt=0;attempt<4;attempt++){
  const file=await api(`/repos/${repository}/contents/public/club.json?ref=main`);
  const original=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));
  const {data,duplicate}=applyOperation(original,operation);
  if(duplicate){applied=true;break}
  try{await api(`/repos/${repository}/contents/public/club.json`,'PUT',{message:`Track Pact: ${operation.type} (#${issueNumber})`,content:Buffer.from(JSON.stringify(data,null,2)+'\n').toString('base64'),sha:file.sha,branch:'main'});applied=true;break}catch(error){if(error.status!==409||attempt===3)throw error}
 }
 if(!applied)throw Error('Could not save this request. Reopen it to retry.');
 await api(`/repos/${repository}/issues/${issueNumber}`,'PATCH',{state:'closed',state_reason:'completed'});
 console.log('Saved Track Pact change and closed its request.');
}catch(error){
 // Error text is local validation output, never the submitted notes or file links.
 console.error(error.message);process.exitCode=1;
}
