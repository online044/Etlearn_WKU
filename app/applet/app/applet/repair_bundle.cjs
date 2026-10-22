const fs = require('fs');
const acorn = require('acorn');

console.log('=== RUNNING REPAIR SCRIPT ===');

function fixAndValidate(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix 1: Direct character slice replace for Reflect.get typeof r
  const sliceStr = code.substring(605140, 605195);
  if (sliceStr.includes('typeof r===')) {
    code = code.substring(0, 605140) + 'ct.get(n,e,t);return typeof r==="function"?r.bind(n):r}}),uh' + code.substring(605195);
    console.log('✅ Fix 1 (typeof r) applied to:', filePath);
  }

  // Fix 2: Supabase key stray backtick
  const keyIdx = code.indexOf('ethiolearn_supabase_key');
  if (keyIdx !== -1) {
    const endIdx = code.indexOf(';if(!t)return', keyIdx);
    if (endIdx !== -1) {
      code = code.substring(0, keyIdx) + 'ethiolearn_supabase_key")||""' + code.substring(endIdx);
      console.log('✅ Fix 2 (Supabase key) applied to:', filePath);
    }
  }

  fs.writeFileSync(filePath, code, 'utf8');

  // Validate with Acorn ESM parser
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    console.log('🎉🎉🎉 SUCCESS! Acorn ESM syntax check PASSED 100% for ' + filePath + '! ZERO SYNTAX ERRORS!');
  } catch (e) {
    console.error('❌ Acorn SyntaxError in ' + filePath + ':', e.message, 'at pos:', e.pos);
    if (e.pos) {
      console.error('Snippet:', JSON.stringify(code.substring(Math.max(0, e.pos - 80), e.pos + 80)));
    }
  }
}

fixAndValidate('/app/applet/dist/assets/index-BTvWbti8.js');
fixAndValidate('/app/applet/public/assets/index-BTvWbti8.js');
