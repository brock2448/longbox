// Forgiving retrieval is separate from exact identity approval. No model or paid service.
export function titleKey(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]/g,'');}
export function issueNumber(value){return String(value??'').trim().replace(/^#\s*/,'').replace(/^0+(?=\d)/,'').toUpperCase();}
export function interpretSearch(text,number=''){
 const raw=String(text||'').trim().slice(0,300),issue=raw.match(/#\s*(\d+(?:\.\d+)?[a-z]?)/i),year=raw.match(/\((19\d{2}|20\d{2})\)/),volume=raw.match(/\b(?:vol(?:ume)?\.?|v)\s*(\d+)\b/i);
 let title=(issue?raw.slice(0,issue.index):raw).replace(/\((?:19|20)\d{2}\)/g,' ').replace(/\b(?:vol(?:ume)?\.?|v)\s*\d+\b/ig,' ').trim();
 if(!title)throw Error('Enter a comic title');
 return{raw,title,number:issueNumber(number||issue?.[1]||''),year:year?+year[1]:null,volume:volume?+volume[1]:null};
}
export function searchQueries(title){
 const words=String(title).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/&/g,' ').replace(/[^a-zA-Z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
 const tokens=words.split(' ').filter(Boolean),withoutFormat=tokens.filter(t=>! /^(?:the|special|oneshot|one|shot)$/i.test(t));
 // Broader queries retrieve suggestions only; annuals and specials stay distinct when ranked.
 const anchors=[...withoutFormat].filter(t=>t.length>=3).sort((a,b)=>b.length-a.length).slice(0,2);return [...new Set([words,withoutFormat.join(' '),withoutFormat.filter(t=>t.length>1).slice(0,2).join(' '),...anchors])].filter(Boolean).slice(0,5);
}
function distance(a,b){let row=Array.from({length:b.length+1},(_,n)=>n);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];}
export function rankCandidate(input,d){
 const expected=titleKey(input.title||input.series),actual=titleKey(d.series?.name),numberOK=!input.number||issueNumber(d.number)===issueNumber(input.number),exactTitle=expected===actual;
 const similarity=expected&&actual?1-distance(expected,actual)/Math.max(expected.length,actual.length):0;
 const year=input.year&&+d.series?.year_began!==+input.year,volume=input.volume&&+d.series?.volume!==+input.volume;
 const warnings=[];if(!exactTitle)warnings.push('Title differs');if(year)warnings.push('Series start year differs');if(volume)warnings.push('Volume differs');if(!numberOK)warnings.push('Issue number differs');
 return{score:(exactTitle?100:Math.round(similarity*70))+(numberOK?10:-100)-(year?12:0)-(volume?15:0),exact:exactTitle&&numberOK&&!year&&!volume,warnings};
}
export function rankResults(input,rows){return [...new Map(rows.filter(d=>d?.id&&d.series?.name&&d.number!=null).map(d=>[String(d.id),d])).values()].sort((a,b)=>rankCandidate(input,b).score-rankCandidate(input,a).score||+a.id-+b.id);}
// Local filtering tolerates punctuation, word order and a single typo in longer words.
// It only changes visible search results; it never establishes comic identity.
export function matchesTitleQuery(query,...values){
 const raw=String(query||'').trim();if(!raw)return true;const text=values.join(' '),q=titleKey(raw);if(titleKey(text).includes(q))return true;
 const tokenize=v=>String(v).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').match(/[a-z0-9]+/g)||[];
 const wanted=tokenize(raw),words=tokenize(text);return wanted.length>0&&wanted.every(w=>words.some(t=>t===w||w.length>=4&&/^[a-z]+$/.test(w)&&Math.abs(w.length-t.length)<=1&&distance(w,t)<=1));
}

// Automatic recognition requires publication evidence, not a fuzzy score alone.
export function publicationKey(title){return titleKey(String(title||'').replace(/^the\s+/i,''));}
export function automaticMatch(item,candidates,peers=[],{complete=true}={}){
 if(!complete||!item.number)return null;
 const known=new Set(peers.filter(p=>p.id!==item.id&&p.sid&&publicationKey(p.series)===publicationKey(item.series)).map(p=>+p.sid));
 const eligible=rankResults({title:item.series,number:item.number},candidates).filter(d=>{
  if(issueNumber(d.number)!==issueNumber(item.number)||publicationKey(d.series?.name)!==publicationKey(item.series))return false;
  if(item.metronId&&+item.metronId!==+d.id||item.sid&&+item.sid!==+d.series?.id)return false;
  if(item.volume&&d.series?.volume&&+item.volume!==+d.series.volume)return false;
  if(known.size===1)return known.has(+d.series?.id);
  if(known.size>1)return false;
  const explicitStart=item.editions?.some(e=>e.metron_year_began);return !!item.year&&(+item.year===+d.series?.year_began||!explicitStart&&String(d.store_date||'').slice(0,4)===String(item.year));
 });
 if(eligible.length!==1)return null;return{candidate:eligible[0],reason:known.size===1?'Verified series already in Library':'Title, issue and publication year agree'};
}
