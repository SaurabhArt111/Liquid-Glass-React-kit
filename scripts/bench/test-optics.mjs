import { computeBezelProfile, fillDisplacement, fillSpecular } from "../../src/liquid-glass/lib/optics.js";
import { SURFACES } from "../../src/liquid-glass/lib/surfaces.js";

// ---- original full-scan reference (verbatim logic) ----
function geom(W,H,r){const wb=W-r*2,hb=H-r*2;return(x1,y1)=>{const l=x1<r,rt=x1>=W-r,t=y1<r,b=y1>=H-r;return[l?x1-r:rt?x1-r-wb:0,t?y1-r:b?y1-r-hb:0]}}
function refDisp(W,H,r,bezel,maxDisp,profile){
  const d=new Uint8ClampedArray(W*H*4); new Uint32Array(d.buffer).fill(0xff008080);
  const rSq=r*r,rp=(r+1)**2,rm=(r-bezel)**2,at=geom(W,H,r);
  for(let y1=0;y1<H;y1++)for(let x1=0;x1<W;x1++){const[x,y]=at(x1,y1);const dSq=x*x+y*y;if(dSq>rp||dSq<rm)continue;
    const dd=Math.sqrt(dSq),op=dSq<rSq?1:1-(dd-r),idx=(((r-dd)/bezel)*profile.length)|0,dist=profile[idx]??0;
    const p=(y1*W+x1)*4;d[p]=128+(-(x/dd)*dist/maxDisp)*127*op;d[p+1]=128+(-(y/dd)*dist/maxDisp)*127*op;d[p+2]=0;d[p+3]=255}
  return d}
function refSpec(W,H,r,dpr,angle=Math.PI/3){
  const d=new Uint8ClampedArray(W*H*4),L=[Math.cos(angle),Math.sin(angle)],rSq=r*r,rp=(r+dpr)**2,rm=Math.max(0,r-2*dpr)**2,at=geom(W,H,r);
  for(let y1=0;y1<H;y1++)for(let x1=0;x1<W;x1++){const[x,y]=at(x1,y1);const dSq=x*x+y*y;if(dSq>rp||dSq<rm)continue;
    const dd=Math.sqrt(dSq),t=(r-dd)/dpr;if(t<0||t>2)continue;const op=dSq<rSq?1:1-(dd-r)/dpr;
    const dot=Math.abs((x/dd)*L[0]+(-y/dd)*L[1]),coef=dot*Math.sqrt(1-(1-t)**2),c=255*coef,p=(y1*W+x1)*4;
    d[p]=d[p+1]=d[p+2]=c;d[p+3]=c*coef*op}
  return d}

let bad=0, cases=0;
for (const [w,h,rad,bzCss,type] of [[200,64,32,19,"convex"],[328,588,38,30,"convex"],[120,120,60,36,"circle"],[300,80,40,40,"lip"],[90,200,20,6,"concave"],[64,64,32,32,"convex"]]) {
  for (const dpr of [1,1.5,2,3]) {
    const W=Math.round(w*dpr),H=Math.round(h*dpr),r=rad*dpr,bz=bzCss*dpr;
    const prof=computeBezelProfile(70,bz/dpr,SURFACES[type],1.5); const mx=Math.max(1,...prof.map(Math.abs));
    const a=new Uint8ClampedArray(W*H*4); fillDisplacement(a,W,H,r,bz,mx,prof);
    const b=refDisp(W,H,r,bz,mx,prof);
    let diff=0; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) diff++;
    const s1=new Uint8ClampedArray(W*H*4); fillSpecular(s1,W,H,r,dpr); const s2=refSpec(W,H,r,dpr);
    let sd=0; for(let i=0;i<s1.length;i++) if(s1[i]!==s2[i]) sd++;
    cases++; if(diff||sd){bad++;console.log("MISMATCH",w,h,rad,bzCss,type,dpr,"disp",diff,"spec",sd)}
  }
}
console.log(`${cases} cases, ${bad} mismatches`);
