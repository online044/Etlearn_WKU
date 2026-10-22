const fs = require('fs');
const acorn = require('acorn');

console.log('=== RUNNING REPAIR SCRIPT ===');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix Reflect.get
  const badReflect = 'Reflect.get(n,e,t);return typeof r===' + '`' + 'function"?r.bind(n):r';
  const goodReflect = 'Reflect.get(n,e,t);return typeof r==="function"?r.bind(n):r';
  code = code.replace(badReflect, goodReflect);

  // Fix SQL block
  const sqlPos = code.indexOf('DROP POLICY IF EXISTS');
  if (sqlPos !== -1) {
    const startQuote = code.lastIndexOf('="', sqlPos);
    const endQuote = code.indexOf('";', sqlPos);
    if (startQuote !== -1 && endQuote !== -1) {
      let rawSql = code.substring(startQuote + 2, endQuote);
      rawSql = rawSql.replaceAll('\"', '"');
      code = code.substring(0, startQuote + 1) + '`' + rawSql + '`' + code.substring(endQuote + 1);
    }
  }

  fs.writeFileSync(filePath, code, 'utf8');

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

fixFile('/app/applet/dist/assets/index-BTvWbti8.js');
fixFile('/app/applet/public/assets/index-BTvWbti8.js');
