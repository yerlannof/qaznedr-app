const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const dir = __dirname;
const review = path.resolve(dir, '../../review/01-master-candidate.html');
const jobs = [
  ['favicon-16.svg', 'favicon-16.png', 16, 16],
  ['favicon-32.svg', 'favicon-32.png', 32, 32],
  ['apple-touch-icon.svg', 'apple-touch-icon.png', 180, 180],
  ['wechat-avatar.svg', 'wechat-avatar.png', 640, 640],
  ['og-default.svg', 'og-default.png', 1200, 630],
];
(async () => {
  for (const [source,target,width,height] of jobs) {
    await sharp(path.join(dir,source),{density:72}).resize(width,height).png().toFile(path.join(dir,target));
  }
  let html=fs.readFileSync(review,'utf8');
  for (const size of [16,32]) html=html.replaceAll(`{PNG${size}}`,fs.readFileSync(path.join(dir,`favicon-${size}.png`)).toString('base64'));
  fs.writeFileSync(review,html);
  const mockups=path.resolve(dir,'../../mockups/01');
  const tile=async file=>sharp(file).resize(560,430,{fit:'contain',background:'#e9ece6'}).png().toBuffer();
  const a=await tile(path.join(mockups,'imagegen-a3-contour.png'));
  const b=await tile(path.join(mockups,'imagegen-a3-refined-lockup.png'));
  const c=await tile(path.join(dir,'logo-stacked.svg'));
  const d=await sharp(path.join(dir,'logo-stacked-inverse.svg')).resize(560,430,{fit:'contain',background:'#253740'}).png().toBuffer();
  const labels=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1020"><style>text{font:600 19px Arial,sans-serif;fill:#253740}</style><text x="24" y="35">A3 selected raster reference</text><text x="614" y="35">A3 refined raster reference</text><text x="24" y="531">Vector candidate · chalk</text><text x="614" y="531">Vector candidate · slate</text></svg>`;
  await sharp({create:{width:1200,height:1020,channels:4,background:'#d8ddd9'}})
    .composite([{input:a,left:20,top:48},{input:b,left:610,top:48},
      {input:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="560" height="430"><path fill="#e9ece6" d="M0 0H560V430H0Z"/></svg>'),left:20,top:544},
      {input:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="560" height="430"><path fill="#253740" d="M0 0H560V430H0Z"/></svg>'),left:610,top:544},
      {input:c,left:20,top:544},{input:d,left:610,top:544},{input:Buffer.from(labels),left:0,top:0}])
    .png().toFile(path.join(dir,'comparison-sheet.png'));
})().catch(e=>{console.error(e);process.exit(1)});
