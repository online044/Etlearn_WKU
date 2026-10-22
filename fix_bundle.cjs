const fs = require('fs');
const acorn = require('acorn');

console.log('--- Fixing Bundle Syntax ---');

const distFile = '/app/applet/dist/assets/index-BTvWbti8.js';
const publicFile = '/app/applet/public/assets/index-BTvWbti8.js';

function repairFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix KaTeX backtick template string concatenation
  code = code.replace(/return"M95,"\+\(622\+e\+t\)+`c-2\.7,0,-7\.17,-2\.7,-13\.5,-8c-5\.8,-5\.3,-9\.5,-10,-9\.5,-14c0,-2,0\.3,-3\.3,1,-4c1\.3,-2.7,23\.83,-20\.7,67\.5,-54c44\.2,-33\.3,65\.8,-50\.3,66\.5,-51c1\.3,-1\.3,3,-2,5,-2c4\.7,0,8\.7,3\.3,12,10s173,378,173,378c0\.7,0,35\.3,-71,104,-213c68\.7,-142,137\.5,-285,206\.5,-429c69,-144,104\.5,-217\.7,106\.5,-221l`/g, 'return"M95,"+(622+e+t)+"c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429c69,-144,104.5,-217.7,106.5,-221l"');

  code = code.replace(/,-221l`\+e\/2\.075\+" -"\+e\+`c5\.3/g, ',-221l"+e/2.075+" -"+e+"c5.3');

  fs.writeFileSync(filePath, code, 'utf8');

  // Validate with Acorn
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    console.log('✅ Acorn ESM syntax check PASSED 100% for:', filePath);
  } catch (e) {
    console.error('❌ Acorn SyntaxError in:', filePath, e.message, 'at pos:', e.pos);
    if (e.pos) {
      console.error('Snippet near error:', JSON.stringify(code.substring(Math.max(0, e.pos - 80), e.pos + 80)));
    }
  }
}

repairFile(distFile);
repairFile(publicFile);
