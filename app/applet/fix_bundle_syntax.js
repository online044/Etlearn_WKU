const fs = require('fs');
const acorn = require('acorn');

console.log('--- Fixing Bundle Syntax ---');

// Re-copy pristine file or fix backtick corruption
const distFile = '/app/applet/dist/assets/index-BTvWbti8.js';
const publicFile = '/app/applet/public/assets/index-BTvWbti8.js';

function repairFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix any unescaped backtick corruptions caused by bash subshell expansion
  // 1. Remove orphaned bash error string insertions if any
  code = code.replace(/sh: [0-9]+: [^\n]+\n/g, '');

  // 2. Ensure template literals in KaTeX SVG path strings use double quotes instead of raw backticks
  // Replace `c-2.7...` backticks in KaTeX SVG functions with "c-2.7..."
  code = code.replace(/return"M95,"\+\(622\+e\+t\)+`c-2\.7/g, 'return"M95,"+(622+e+t)+"c-2.7');
  code = code.replace(/,-221l`\+e\/2\.075\+" -"\+e\+`c5\.3/g, ',-221l"+e/2.075+" -"+e+"c5.3');

  // 3. Convert any remaining unescaped KaTeX backticks to double quotes
  let changes = 0;
  code = code.replace(/`([a-zA-Z0-9\s,\.\-+]+)`/g, (match, inner) => {
    changes++;
    return JSON.stringify(inner);
  });

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Repaired ${filePath} (applied ${changes} replacements)`);

  // Validate with Acorn
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    console.log(`✅ Acorn ESM syntax check PASSED 100% for ${filePath}!`);
  } catch (e) {
    console.error(`❌ Acorn SyntaxError in ${filePath}:`, e.message, 'at pos:', e.pos, 'loc:', e.loc);
    if (e.pos) {
      console.error('Snippet near error:', JSON.stringify(code.substring(Math.max(0, e.pos - 80), e.pos + 80)));
    }
  }
}

repairFile(distFile);
repairFile(publicFile);
