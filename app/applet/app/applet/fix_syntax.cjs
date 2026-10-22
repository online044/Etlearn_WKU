const fs = require('fs');
const acorn = require('acorn');

console.log('--- Cleaning logHandler TypeError in fix_syntax.cjs ---');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix SIWE block
  const startPos = code.indexOf('w=s.statement');
  const endPos = code.indexOf('u){let P', startPos);
  if (startPos !== -1 && endPos !== -1) {
    const cleanSIWE = 'w=s.statement?s.statement:"",A=""+v+" wants you to sign in with your Ethereum account:"+x+w;let N=A+"\\nURI: "+p+"\\nVersion: "+g+"\\nChain ID: "+t+(o?"\\nNonce: "+o:"")+"\\nIssued At: "+a.toISOString();if(r&&(N+="\\nExpiration Time: "+r.toISOString()),l&&(N+="\\nNot Before: "+l.toISOString()),c&&(N+="\\nRequest ID: "+c)),';
    const fixedSIWE = cleanSIWE.replace('+c)),', '+c),');
    code = code.substring(0, startPos) + fixedSIWE + code.substring(endPos);
  }

  // Fix logHandler TypeError string
  const pos = code.indexOf('must be a function');
  if (pos !== -1) {
    const startPos = code.lastIndexOf('throw new TypeError', pos);
    const endPos = code.indexOf(';this._logHandler=e}', pos);
    if (startPos !== -1 && endPos !== -1) {
      code = code.substring(0, startPos) + 'throw new TypeError("Value assigned to logHandler must be a function")' + code.substring(endPos);
      console.log('✅ Replaced logHandler TypeError in:', filePath);
    }
  }

  fs.writeFileSync(filePath, code, 'utf8');

  // Validate with Acorn
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    console.log(`🎉🎉🎉 SUCCESS! Acorn ESM syntax check PASSED 100% for ${filePath}! ZERO SYNTAX ERRORS!`);
  } catch (e) {
    console.error(`❌ Acorn SyntaxError in ${filePath}:`, e.message, 'at pos:', e.pos, 'loc:', e.loc);
    if (e.pos) {
      console.error('Snippet near error:', JSON.stringify(code.substring(Math.max(0, e.pos - 80), e.pos + 80)));
    }
  }
}

fixFile('/app/applet/dist/assets/index-BTvWbti8.js');
fixFile('/app/applet/public/assets/index-BTvWbti8.js');
