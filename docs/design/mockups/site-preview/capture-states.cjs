const {chromium}=require('playwright');const path=require('path');
const base='file://'+path.resolve(__dirname,'../../review/site-preview.html');
const out=name=>path.join(__dirname,'state-'+name+'.png');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:375,height:812}});
await page.goto(base+'?screen=home&lang=en&theme=light');
await page.locator('.hero .btn.primary').hover();await page.screenshot({path:out('hover')});
await page.locator('.hero .btn.primary').focus();await page.screenshot({path:out('focus')});
const box=await page.locator('.hero .btn.primary').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.screenshot({path:out('active')});await page.mouse.up();
await page.locator('.menu-btn').click();await page.screenshot({path:out('menu-disabled')});
await page.goto(base+'?screen=portfolio&lang=en&theme=light');await page.locator('.filter-toggle').click();await page.screenshot({path:out('filter-overlay')});
await page.locator('#metalFilter').selectOption('0');await page.locator('#typeFilter').selectOption('1');await page.locator('.filter-close').click();await page.screenshot({path:out('filter-empty')});
await page.goto(base+'?screen=portfolio&lang=en&theme=dark');await page.screenshot({path:out('status-cards'),fullPage:true});
await page.goto(base+'?screen=contact&lang=en&theme=light');await page.locator('.site-head').evaluate(x=>x.style.position='static');await page.locator('.float-contact').evaluate(x=>x.style.display='none');await page.locator('.form button[type=submit]').scrollIntoViewIfNeeded();await page.locator('.form button[type=submit]').click();await page.locator('.form .note').click();await page.locator('.form').screenshot({path:out('invalid-form')});
await page.locator('[name=name]').fill('Review');await page.locator('[name=reply]').fill('review@example.test');await page.locator('[name=message]').fill('Design check');await page.locator('.form button[type=submit]').click();await page.locator('.form').screenshot({path:out('form-status')});
await browser.close();console.log('Captured 9 component-state screenshots');
})().catch(e=>{console.error(e);process.exit(1)});
