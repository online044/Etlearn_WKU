const fs = require('fs');
const acorn = require('acorn');

console.log('--- Fixing Bundle Syntax ---');

const distFile = '/app/applet/dist/assets/index-BTvWbti8.js';
const publicFile = '/app/applet/public/assets/index-BTvWbti8.js';

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  const c4eIdx = code.indexOf('C4e=function');
  const k4eIdx = code.indexOf('k4e=function', c4eIdx);

  if (c4eIdx !== -1 && k4eIdx !== -1) {
    const cleanC4e = 'C4e=function(e,t){return"M95,"+(622+e+t)+"c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429c69,-144,104.5,-217.7,106.5,-221l"+e/2.075+" -"+e+"c5.3,-9.3,12,-14,20,-14H400000v"+(40+e)+"H845.2724s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47zM"+(834+e)+" "+t+"h400000v"+(40+e)+"h-400000z"},';
    code = code.substring(0, c4eIdx) + cleanC4e + code.substring(k4eIdx);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('✅ Replaced C4e with clean JS in:', filePath);
  }

  // Validate updated code with Acorn
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    console.log('🎉 PERFECT! Acorn ESM syntax check PASSED 100% for:', filePath);
  } catch (e) {
    console.error('❌ Acorn SyntaxError in:', filePath, e.message, 'at pos:', e.pos, 'loc:', e.loc);
    if (e.pos) {
      console.error('Snippet near error:', JSON.stringify(code.substring(Math.max(0, e.pos - 80), e.pos + 80)));
    }
  }
}

fixFile(distFile);
fixFile(publicFile);
