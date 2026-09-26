const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const review = __dirname;
const pages = ['00-design-review.html', '03-home.html', '04-portfolio.html', '05-pages.html', '06-insights.html'];
const issues = [];
const linkChecks = [];

function scan(file) {
  const html = fs.readFileSync(path.join(review, file), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
  for (const raw of refs) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(raw)) continue;
    const target = decodeURIComponent(raw.split(/[?#]/)[0]);
    if (!target) continue;
    const abs = path.resolve(review, target);
    const ok = fs.existsSync(abs);
    linkChecks.push({page:file,ref:raw,exists:ok});
    if (!ok) issues.push({type:'missing-reference',page:file,ref:raw});
  }
}
pages.forEach(scan);

(async()=>{
 const browser = await chromium.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--no-sandbox']});
 const results=[];
 for (const file of pages) {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[]; const failed=[];
  page.on('pageerror', e=>errors.push(String(e)));
  page.on('console', m=>{if(m.type()==='error') errors.push(m.text())});
  page.on('requestfailed', r=>failed.push(r.url()+': '+r.failure()?.errorText));
  await page.goto('file://'+path.join(review,file),{waitUntil:'load'});
  await page.waitForTimeout(700);
  const desktop=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,bodyHeight:document.body.scrollHeight,images:[...document.images].map(i=>({src:i.getAttribute('src'),ok:i.complete&&i.naturalWidth>0}))}));
  if(desktop.scrollWidth>desktop.clientWidth) issues.push({type:'desktop-overflow',page:file,details:desktop});
  for(const img of desktop.images) if(!img.ok) issues.push({type:'image-not-rendered',page:file,src:img.src});
  await page.setViewportSize({width:375,height:812}); await page.waitForTimeout(250);
  const mobile=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,bodyHeight:document.body.scrollHeight,images:[...document.images].map(i=>({src:i.getAttribute('src'),ok:i.complete&&i.naturalWidth>0}))}));
  if(mobile.scrollWidth>mobile.clientWidth) issues.push({type:'mobile-overflow',page:file,details:mobile});
  for(const img of mobile.images) if(!img.ok) issues.push({type:'mobile-image-not-rendered',page:file,src:img.src});
  if(file==='00-design-review.html') {
   await page.screenshot({path:path.join(review,'final-review-overview.png'),fullPage:false});
   await page.locator('#page').selectOption('portfolio');
   await page.locator('#lang').selectOption('en');
   await page.locator('#theme').selectOption('dark');
   await page.locator('#width').selectOption('768');
   const frame=page.locator('#live');
   await page.waitForTimeout(300);
   const attrs=await frame.evaluate(el=>({src:el.getAttribute('src'),width:getComputedStyle(el).width}));
   const href=await page.locator('#open').getAttribute('href');
   if(!attrs.src.includes('screen=portfolio')||!attrs.src.includes('lang=en')||!attrs.src.includes('theme=dark')||attrs.width!=='768px'||href!==attrs.src) issues.push({type:'selector-sync-failed',details:{attrs,href}});
   const child=page.frames().find(f=>f!==page.mainFrame());
   await child.waitForLoadState('load').catch(()=>{});
   const childErrors=[]; child.on('pageerror',e=>childErrors.push(String(e)));
   const childWidth=await child.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})).catch(e=>({error:String(e)}));
   if(childErrors.length) issues.push({type:'iframe-browser-errors',errors:childErrors});
   await page.locator('#width').selectOption('375'); await page.waitForTimeout(150);
   const frameMobile=await page.locator('#live').evaluate(el=>({w:getComputedStyle(el).width,src:el.getAttribute('src')}));
   await page.screenshot({path:path.join(review,'final-review-overview-375.png'),fullPage:false});
   await page.locator('a[href="03-home.html"]').first().click();
   if(!page.url().endsWith('03-home.html')) issues.push({type:'anchor-navigation-failed',page:file});
   results.push({page:file,desktop,mobile,selectorState:{attrs,href},anchorUrl:page.url(),iframeMobile:frameMobile,iframeErrors:childErrors,iframeWidth:childWidth,errors,failed});
  } else results.push({page:file,desktop,mobile,errors,failed});
  if(errors.length) issues.push({type:'browser-errors',page:file,errors});
  if(failed.length) issues.push({type:'failed-requests',page:file,failed});
  await page.close();
 }
 await browser.close();
 const report={checkedAt:new Date().toISOString(),pages,referenceCount:linkChecks.length,missingReferences:linkChecks.filter(x=>!x.exists),results,issues};
 fs.writeFileSync(path.join(review,'final-review-qa.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({references:linkChecks.length,issues,results:results.map(r=>({page:r.page,desktop:r.desktop,mobile:r.mobile,...(r.selectorState?{selectorState:r.selectorState,anchorUrl:r.anchorUrl,iframeMobile:r.iframeMobile}:{}),errors:r.errors,failed:r.failed}))},null,2));
 await browser.close().catch(()=>{});
})().catch(e=>{console.error(e);process.exitCode=1});
