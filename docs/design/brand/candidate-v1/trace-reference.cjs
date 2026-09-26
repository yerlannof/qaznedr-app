// Extract the selected A3 raster lettering as path-only review geometry.
// This traces existing pixels; it does not invent lettering or use a substitute font.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const source = path.resolve(__dirname, '../../mockups/01/imagegen-a3-refined-lockup.png');

function simplifyOpen(points, tolerance) {
  if (points.length <= 2) return points;
  const a=points[0], b=points[points.length-1];
  let largest=-1, index=-1;
  for (let i=1;i<points.length-1;i++) {
    const p=points[i], dx=b[0]-a[0], dy=b[1]-a[1];
    const t=dx*dx+dy*dy ? Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))) : 0;
    const d=Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dy));
    if(d>largest){largest=d;index=i}
  }
  if(largest<=tolerance) return [a,b];
  return [...simplifyOpen(points.slice(0,index+1),tolerance).slice(0,-1),...simplifyOpen(points.slice(index),tolerance)];
}
function simplifyClosed(points,tolerance){
  let far=0,max=-1;
  const a=points[0];
  points.forEach((p,i)=>{const d=Math.hypot(p[0]-a[0],p[1]-a[1]);if(d>max){max=d;far=i}});
  if(far<2 || far>points.length-2) return points;
  const one=simplifyOpen(points.slice(0,far+1),tolerance);
  const two=simplifyOpen([...points.slice(far),points[0]],tolerance);
  return [...one.slice(0,-1),...two.slice(0,-1)];
}
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const mul=(a,s)=>[a[0]*s,a[1]*s],dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const norm=a=>{const d=Math.hypot(...a)||1;return mul(a,1/d)};
function bezier(b,u){const t=1-u;return add(add(mul(b[0],t*t*t),mul(b[1],3*t*t*u)),add(mul(b[2],3*t*u*u),mul(b[3],u*u*u)))}
function fitCurve(points,error,t1=norm(sub(points[1],points[0])),t2=norm(sub(points[points.length-2],points[points.length-1]))){
  const n=points.length,p0=points[0],p3=points[n-1];
  if(n===2){const d=Math.hypot(...sub(p3,p0))/3;return [[p0,add(p0,mul(t1,d)),add(p3,mul(t2,d)),p3]]}
  const u=[0];for(let i=1;i<n;i++)u.push(u[i-1]+Math.hypot(...sub(points[i],points[i-1])));
  const total=u[n-1]||1;for(let i=1;i<n;i++)u[i]/=total;
  let c00=0,c01=0,c11=0,x0=0,x1=0;
  for(let i=0;i<n;i++){
    const t=u[i],v=1-t,b0=v*v*v,b1=3*v*v*t,b2=3*v*t*t,b3=t*t*t;
    const a1=mul(t1,b1),a2=mul(t2,b2);
    const rhs=sub(points[i],add(mul(p0,b0+b1),mul(p3,b2+b3)));
    c00+=dot(a1,a1);c01+=dot(a1,a2);c11+=dot(a2,a2);x0+=dot(a1,rhs);x1+=dot(a2,rhs);
  }
  const det=c00*c11-c01*c01;
  let alpha1=det?(x0*c11-x1*c01)/det:0,alpha2=det?(c00*x1-c01*x0)/det:0;
  if(alpha1<1e-4||alpha2<1e-4||alpha1>total*.75||alpha2>total*.75)alpha1=alpha2=total/3;
  const curve=[p0,add(p0,mul(t1,alpha1)),add(p3,mul(t2,alpha2)),p3];
  let max=0,split=Math.floor(n/2);
  for(let i=1;i<n-1;i++){const d=dot(sub(bezier(curve,u[i]),points[i]),sub(bezier(curve,u[i]),points[i]));if(d>max){max=d;split=i}}
  if(max<=error*error||n<4)return [curve];
  const center=norm(sub(points[split-1],points[split+1]));
  return [...fitCurve(points.slice(0,split+1),error,t1,center),...fitCurve(points.slice(split),error,mul(center,-1),t2)];
}
function curvedPath(points,originX,originY,preserveTail=false){
  // Two light Chaikin-style passes remove one-pixel stair steps on round bowls.
  for(let pass=0;pass<2;pass++)points=points.map((p,i)=>{
    if(preserveTail&&p[0]>70&&p[1]>80)return p;
    const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];
    return [(a[0]+2*p[0]+b[0])/4,(a[1]+2*p[1]+b[1])/4];
  });
  const n=points.length,angles=[];
  for(let i=0;i<n;i++){
    const a=points[(i+n-1)%n],b=points[i],c=points[(i+1)%n];
    const u=sub(b,a),v=sub(c,b);
    angles.push(Math.atan2(u[0]*v[1]-u[1]*v[0],dot(u,v))*180/Math.PI);
  }
  const anchors=[];
  for(let i=0;i<n;i++){
    const a=points[(i+n-1)%n],b=points[i],c=points[(i+1)%n];
    const len=Math.min(Math.hypot(...sub(b,a)),Math.hypot(...sub(c,b)));
    const pa=angles[(i+n-1)%n],ca=angles[i],na=angles[(i+1)%n];
    const rounded=Math.sign(pa)===Math.sign(ca)&&Math.sign(ca)===Math.sign(na)&&Math.abs(pa)>8&&Math.abs(na)>8;
    if((preserveTail&&b[0]>70&&b[1]>80)||(Math.abs(ca)>35&&len>2.5&&!rounded))anchors.push(i);
  }
  if(anchors.length<2){
    anchors.length=0;anchors.push(0);
    let far=0,dist=-1;for(let i=1;i<n;i++){const d=dot(sub(points[i],points[0]),sub(points[i],points[0]));if(d>dist){dist=d;far=i}}
    anchors.push(far);
  }
  anchors.sort((a,b)=>a-b);
  const fmt=v=>Number(v.toFixed(2));
  const pt=p=>`${fmt(p[0]-originX)} ${fmt(p[1]-originY)}`;
  let d=`M${pt(points[anchors[0]])}`;
  for(let k=0;k<anchors.length;k++){
    const a=anchors[k],b=anchors[(k+1)%anchors.length];
    const span=[];let i=a;
    while(true){span.push(points[i]);if(i===b&&span.length>1)break;i=(i+1)%n;if(span.length>n+1)throw Error('bad contour span')}
    for(const curve of fitCurve(span,1.7))d+=` C${pt(curve[1])} ${pt(curve[2])} ${pt(curve[3])}`;
  }
  return d+' Z';
}
function trace(data,info,box,threshold){
  const {left,top,width,height}=box;
  const mask=new Uint8Array(width*height);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++){
    const i=((top+y)*info.width+left+x)*info.channels;
    const r=data[i],g=data[i+1],b=data[i+2];
    const lum=.2126*r+.7152*g+.0722*b;
    mask[y*width+x]=(lum<threshold)?1:0;
  }
  const ink=(x,y)=>x>=0&&y>=0&&x<width&&y<height&&mask[y*width+x];
  const edges=[], starts=new Map();
  function add(x1,y1,x2,y2,d){
    const index=edges.length;
    edges.push({a:[x1,y1],b:[x2,y2],d,used:false});
    const k=`${x1},${y1}`;
    if(!starts.has(k))starts.set(k,[]);
    starts.get(k).push(index);
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) if(ink(x,y)){
    if(!ink(x,y-1))add(x,y,x+1,y,0);
    if(!ink(x+1,y))add(x+1,y,x+1,y+1,1);
    if(!ink(x,y+1))add(x+1,y+1,x,y+1,2);
    if(!ink(x-1,y))add(x,y+1,x,y,3);
  }
  const loops=[];
  for(let j=0;j<edges.length;j++){
    if(edges[j].used)continue;
    let current=j,points=[];
    for(let guard=0;guard<edges.length+1;guard++){
      const edge=edges[current];edge.used=true;points.push(edge.a);
      const [ex,ey]=edge.b;
      if(ex===points[0][0]&&ey===points[0][1])break;
      const candidates=(starts.get(`${ex},${ey}`)||[]).filter(i=>!edges[i].used);
      if(!candidates.length)throw Error(`Open contour at ${ex},${ey}`);
      const rank=[1,0,3,2];
      candidates.sort((a,b)=>rank.indexOf((edges[a].d-edge.d+4)%4)-rank.indexOf((edges[b].d-edge.d+4)%4));
      current=candidates[0];
    }
    let area=0;
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-b[0]*a[1]}
    if(Math.abs(area)>30)loops.push({points:simplifyClosed(points,1.35),area:area/2});
  }
  let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;
  for(const loop of loops)for(const [x,y] of loop.points){minx=Math.min(minx,x);miny=Math.min(miny,y);maxx=Math.max(maxx,x);maxy=Math.max(maxy,y)}
  const bounds=loops.map(({points})=>({minx:Math.min(...points.map(p=>p[0])),maxx:Math.max(...points.map(p=>p[0])),miny:Math.min(...points.map(p=>p[1])),maxy:Math.max(...points.map(p=>p[1]))}));
  const linearPath=points=>'M'+simplifyClosed(points,2.0).map(([x,y])=>`${x-minx} ${y-miny}`).join(' L')+' Z';
  const round=box.top<700 ? b=>(b.minx<130||(b.minx>=557&&b.minx<650)) : b=>((b.minx>=68&&b.minx<110)||(b.minx>=175&&b.minx<215)||(b.minx>=323));
  const coord=(x,y)=>`${x-minx} ${y-miny}`;
  function cleanedHolding(b){
    // Round the three small bowls against the measured raster bounds. The
    // original proportions and placements stay fixed; this removes pixel stair steps.
    if(b.minx>=66&&b.minx<=69&&b.maxx>=103)return `M${coord(86,10)} C${coord(96,10)} ${coord(104,18)} ${coord(104,28)} C${coord(104,38)} ${coord(96,46)} ${coord(86,46)} C${coord(75,46)} ${coord(67,38)} ${coord(67,28)} C${coord(67,18)} ${coord(75,10)} ${coord(86,10)} Z`;
    if(b.minx===75&&b.maxx<=97)return `M${coord(86,17)} C${coord(92,17)} ${coord(97,22)} ${coord(97,28)} C${coord(97,34)} ${coord(92,39)} ${coord(86,39)} C${coord(80,39)} ${coord(75,34)} ${coord(75,28)} C${coord(75,22)} ${coord(80,17)} ${coord(86,17)} Z`;
    if(b.minx>=175&&b.minx<=177&&b.maxx>=206)return `M${coord(176,10)} H${185-minx} C${coord(199,10)} ${coord(207,18)} ${coord(207,28)} C${coord(207,38)} ${coord(199,46)} ${coord(185,46)} H${176-minx} Z`;
    if(b.minx===183&&b.maxx<=201)return `M${coord(183,17)} H${185-minx} C${coord(194,17)} ${coord(200,21)} ${coord(200,28)} C${coord(200,35)} ${coord(194,39)} ${coord(185,39)} H${183-minx} Z`;
    if(b.minx>=323)return `M${coord(356,16)} L${coord(351,20)} C${coord(348,16)} ${coord(344,15)} ${coord(340,15)} C${coord(333,15)} ${coord(328,21)} ${coord(328,28)} C${coord(328,36)} ${coord(333,41)} ${coord(340,41)} C${coord(345,41)} ${coord(350,38)} ${coord(353,34)} V${31-miny} H${342-minx} V${26-miny} H${358-minx} V${38-miny} C${coord(354,43)} ${coord(347,46)} ${coord(340,46)} C${coord(329,46)} ${coord(323,38)} ${coord(323,28)} C${coord(323,17)} ${coord(330,10)} ${coord(340,10)} C${coord(347,10)} ${coord(352,12)} ${coord(356,16)} Z`;
    return null;
  }
  const paths=loops.map(({points},i)=>box.top>=700&&cleanedHolding(bounds[i]) || (round(bounds[i])?curvedPath(points,minx,miny,box.top<700&&bounds[i].minx<130):linearPath(points)));
  return {source:path.basename(source),crop:box,threshold,width:maxx-minx,height:maxy-miny,loops:paths.length,paths};
}
(async()=>{
  const {data,info}=await sharp(source).blur(1.4).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const word=trace(data,info,{left:390,top:585,width:760,height:135},125);
  const holding=trace(data,info,{left:580,top:718,width:380,height:55},195);
  fs.writeFileSync(path.join(__dirname,'lettering-paths.json'),JSON.stringify({word,holding},null,2)+'\n');
  console.log(`word ${word.width}×${word.height}, ${word.loops} contours; HOLDING ${holding.width}×${holding.height}, ${holding.loops} contours`);
})().catch(e=>{console.error(e);process.exit(1)});
