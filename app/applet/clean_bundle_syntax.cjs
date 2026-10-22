const fs = require('fs');
const acorn = require('acorn');

console.log('--- Cleaning All Multiline Template Strings ---');

function cleanBundle(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace all multiline backtick template strings with clean single-line JSON string literals
  let count = 0;
  const backtickRegex = /`([^`]+)`/g;
  code = code.replace(backtickRegex, (match, inner) => {
    if (inner.includes('\n') || inner.includes('\r')) {
      count++;
      const cleanStr = inner.replace(/[\r\n]+/g, '');
      return JSON.stringify(cleanStr);
    }
    return match;
  });

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Cleaned ${count} multiline template strings in: ${filePath}`);

  // Validate with Acorn ESM parser
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

cleanBundle('/app/applet/dist/assets/index-BTvWbti8.js');
cleanBundle('/app/applet/public/assets/index-BTvWbti8.js');
