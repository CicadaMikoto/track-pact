import {isDeepStrictEqual} from 'node:util';
import {defaultPools,genres,participants,blank,generate} from '../app/model.ts';
const fail=message=>{throw Error(message)};
const check=(test,message)=>{if(!test)fail(message)};
const text=(value,name,max=500)=>{check(typeof value==='string'&&value.length<=max,`${name} must be text, at most ${max} characters.`);return value};
const integer=(value,min,max,name)=>{check(Number.isInteger(value)&&value>=min&&value<=max,`${name} is out of range.`);return value};
const day=value=>{text(value,'Deadline',10);check(/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value,'Invalid deadline.');return value};
const match=(a,b)=>check(isDeepStrictEqual(a,b),'The shared record changed since this edit. Refresh Track Pact and try again.');
export function compactSettings(s){return {min:s.min,max:s.max,range:s.range,excluded:s.excluded,weights:Object.fromEntries(Object.entries(s.pools).map(([k,v])=>[k,v.map(e=>e.weight)]))}}
function validSettings(s){integer(s.min,40,220,'Minimum BPM');integer(s.max,s.min,220,'Maximum BPM');check(typeof s.range==='boolean','Invalid BPM range preference.');text(s.excluded,'Excluded BPMs',500);check(s.excluded.split(',').every(x=>x.trim()===''||(/^\d+$/.test(x.trim())&&Number(x)>=40&&Number(x)<=220)),'Excluded BPMs must be a comma-separated list.');check(s.weights&&typeof s.weights==='object','Missing weights.');const pools={};for(const [k,choices] of Object.entries(defaultPools)){check(Array.isArray(s.weights[k])&&s.weights[k].length===choices.length,`Invalid ${k} pool.`);pools[k]=choices.map((e,i)=>({...e,weight:integer(s.weights[k][i],0,10,'Weight')}));check(pools[k].some(e=>e.weight>0),`Enable at least one ${k} choice.`)}const result={min:s.min,max:s.max,range:s.range,excluded:s.excluded,pools};generate(result,1,'2026-09-13');return result}
function validFields(f){check(f&&typeof f==='object','Missing challenge fields.');const out={};for(const k of ['bpm','key',...Object.keys(defaultPools).filter(k=>!['root','mode'].includes(k))]){out[k]=text(f[k],k);if(defaultPools[k])check(defaultPools[k].some(e=>e.value===f[k]),`Unsupported ${k}.`)}const genre=genres.find(g=>g.name===out.style);check(genre,'Unknown genre.');check(/^\d+(–\d+)?$/.test(out.bpm),'Invalid tempo.');const tempos=out.bpm.split('–').map(Number);check(tempos.every(b=>b>=genre.min&&b<=genre.max)&&(tempos.length===1||tempos[0]<=tempos[1]),'Tempo must fit the selected genre.');check(defaultPools.root.some(r=>genre.modes.some(m=>`${r.value} ${m}`===out.key)),'Mode must fit the selected genre.');return out}
function validSubmission(s){check(s&&typeof s==='object','Missing submission.');check(['Not Started','WIP','Submitted'].includes(s.status),'Invalid status.');const result={status:s.status,title:text(s.title,'Title',120),notes:text(s.notes,'Notes',1000),link:text(s.link,'Link',500),file:text(s.file,'File reference',250)};if(s.link){let url;try{url=new URL(s.link)}catch{fail('Enter a valid http or https submission link.')}check(['https:','http:'].includes(url.protocol),'Only http and https links are supported.')}return result}
export function applyOperation(original,op){
 check(op&&op.version===1,'Unsupported request format.');check(typeof op.requestId==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(op.requestId),'Invalid request ID.');
 const data=structuredClone(original);if((data.appliedRequests||[]).includes(op.requestId))return {data,duplicate:true};
 if(op.type==='lock'){
  const current=data.weeks.at(-1);match(op.currentId,current.id);const w=op.week;check(w&&w.number===current.number+1,'Week number must follow the current week.');text(w.id,'Week ID',80);check(/^[a-zA-Z0-9-]+$/.test(w.id)&&!data.weeks.some(x=>x.id===w.id),'Invalid or duplicate week ID.');const title=text(w.title,'Title',50).trim();check(title.length>0,'Give the challenge a title.');data.weeks.push({id:w.id,number:w.number,title,deadline:day(w.deadline),locked:true,fields:validFields(w.fields),submissions:Object.fromEntries(participants.map(p=>[p.id,blank()])),reactions:{}});
 }else if(op.type==='settings'){match(op.base,compactSettings(data.settings));data.settings=validSettings(op.settings)}
 else{
  const w=data.weeks.find(x=>x.id===op.weekId);check(w,'Week not found.');
  if(op.type==='deadline'){match(op.base,w.deadline);w.deadline=day(op.deadline)}
  else{check(participants.some(p=>p.id===op.participantId),'Unknown participant.');const id=op.participantId;
   if(op.type==='submission'){match(op.base,w.submissions[id]);w.submissions[id]=validSubmission(op.submission)}
   else if(op.type==='reaction'){check(participants.every(p=>w.submissions[p.id].status==='Submitted'),'Both producers must submit before reactions open.');match(op.base,w.reactions[id]||{});const reaction={};check(op.reaction&&typeof op.reaction==='object','Missing reaction.');for(const [k,v] of Object.entries(op.reaction)){check(['Adherence','Creativity','Sound design','Arrangement','Favorite moment'].includes(k),'Unknown reaction category.');if(k==='Favorite moment')reaction[k]=text(v,k,400);else{check(['Unrated','1','2','3','4','5'].includes(v),'Rating must be between 1 and 5.');reaction[k]=v}}w.reactions[id]=reaction}
   else fail('Unknown operation.');
  }
 }
 data.version=1;data.revision=(data.revision||0)+1;data.appliedRequests=[...(data.appliedRequests||[]),op.requestId].slice(-1000);return {data,duplicate:false};
}
export function parseRequest(body){check(typeof body==='string'&&body.length<=20000,'Request is missing or too large.');const match=body.match(/```json\s*([\s\S]*?)\s*```/);check(match,'Missing Track Pact request block.');return JSON.parse(match[1])}
export function isAuthorized(permission){return ['admin','maintain','write'].includes(permission)}
