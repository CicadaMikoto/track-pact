import {useEffect,useRef,useState} from 'react';
import seedData from '../public/club.json';
import {type Week,type Settings} from './model';
import {same,sharedUrl} from './github';
export type Data={version:1;revision?:number;weeks:Week[];draft:Week|null;settings:Settings};
const key='track-pact-github-v1';
const normalized=(d:Data)=>({version:1,weeks:d.weeks,settings:d.settings});
const initial=()=>({...structuredClone(seedData),draft:null}) as Data;
export function useShared(){
 const [data,setData]=useState<Data|null>(null),[base,setBase]=useState<Data>(initial),[incoming,setIncoming]=useState<Data|null>(null),[status,setStatus]=useState('Connecting to GitHub…');
 const current=useRef<Data|null>(null),baseline=useRef<Data>(initial()),busy=useRef(false);
 function persist(d:Data,b:Data){try{localStorage.setItem(key,JSON.stringify({data:d,base:b}));return true}catch{setStatus('Local backup unavailable — export your edits');return false}}
 function commit(d:Data){current.current=d;setData(d);if(persist(d,baseline.current))setStatus(same(normalized(d),normalized(baseline.current))?'Shared record loaded':'Local edits — save on GitHub')}
 function adopt(r:Data){const local=current.current;const d={...r,draft:local?.draft&&!r.weeks.some(w=>w.id===local.draft!.id)?local.draft:null};baseline.current=r;current.current=d;setBase(r);setData(d);setIncoming(null);if(persist(d,r))setStatus('Shared record loaded')}
 async function refresh(){if(busy.current)return;busy.current=true;try{const response=await fetch(`${sharedUrl}?t=${Date.now()}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error();const remote=await response.json() as Data;if(remote.version!==1||!Array.isArray(remote.weeks)||!remote.weeks.length||!remote.settings?.pools)throw Error();const r={...remote,draft:null} as Data;const l=current.current;const b=baseline.current;if(!l||same(normalized(l),normalized(b))||same(normalized(l),normalized(r))){adopt(r)}else if(!same(normalized(r),normalized(b))){setIncoming(r);setStatus('Shared update available — your edits are preserved')}else setStatus('Local edits — save on GitHub')}catch{setStatus('Offline / cached record — local edits are safe')}finally{busy.current=false}}
 useEffect(()=>{let d=initial(),b=initial();try{const stored=JSON.parse(localStorage.getItem(key)||'null');if(stored?.data?.version===1&&stored?.base?.version===1&&stored.data.weeks?.length){d=stored.data;b=stored.base}}catch{}current.current=d;baseline.current=b;setData(d);setBase(b);void refresh();const interval=setInterval(()=>void refresh(),60000);const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{clearInterval(interval);window.removeEventListener('focus',focus)}},[]);
 return {data,base,commit,status,refresh,incoming,adopt};
}

