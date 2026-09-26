const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const base='file://'+path.resolve(__dirname,'../../review/site-preview.html');const results=[];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
for(const width of [375,1440])for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:900}});await page.goto(base+'?screen=home&lang=en&theme='+theme);
 const target=width===375?page.locator('.menu-btn'):page.locator('.desk-nav a').first();await target.focus();
 const nav=await target.evaluate(x=>({outline:getComputedStyle(x).outlineColor,height:x.getBoundingClientRect().height}));
 const footer=await page.locator('.site-footer a').evaluateAll(xs=>xs.map(x=>({text:x.textContent,height:x.getBoundingClientRect().height})));
 await page.locator('.hero .btn.primary').focus();const primary=await page.locator('.hero .btn.primary').evaluate(x=>getComputedStyle(x).outlineColor);
 await page.locator('.contact-block .btn.primary').focus();const contact=await page.locator('.contact-block .btn.primary').evaluate(x=>getComputedStyle(x).outlineColor);
 results.push({width,theme,nav,primary,contact,footer,pass:nav.height>=44&&footer.every(x=>x.height>=44)&&nav.outline===(theme==='dark'?'rgb(233, 236, 230)':'rgb(37, 55, 64)')&&primary===(theme==='dark'?'rgb(233, 236, 230)':'rgb(37, 55, 64)')&&contact==='rgb(233, 236, 230)'});
 if(width===375&&theme==='light'){await page.locator('.hero .btn.primary').focus();await page.screenshot({path:path.join(__dirname,'state-focus.png')})}
 if((width===375&&theme==='light')||(width===1440&&theme==='dark')){await page.locator('.site-footer').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'state-footer-'+theme+'-'+width+'.png')})}
 await page.close();
 const formPage=await browser.newPage({viewport:{width,height:900}});await formPage.goto(base+'?screen=contact&lang=en&theme='+theme);await formPage.locator('input[name=name]').focus();const input=await formPage.locator('input[name=name]').evaluate(x=>({outline:getComputedStyle(x).outlineColor,height:x.getBoundingClientRect().height}));results.push({width,theme,input,pass:input.height>=44&&input.outline===(theme==='dark'?'rgb(233, 236, 230)':'rgb(37, 55, 64)')});await formPage.close();
}
const failures=results.filter(x=>!x.pass);fs.writeFileSync(path.join(__dirname,'qa-focus.json'),JSON.stringify({results,failures},null,2));console.log(JSON.stringify({checks:results.length,failures:failures.length},null,2));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
