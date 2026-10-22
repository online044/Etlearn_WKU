
const fs = require("fs");
const acorn = require("acorn");

console.log("=== RUNNING FIX SCRIPT ===");

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, "utf8");

  // Restore CSS escape function vs(d)
  code = code.replace("return\"\\\"+h.charCodeAt(0).toString(16)+\" \"", "return\"\\\\\"+h.charCodeAt(0).toString(16)+\" \"");
  code = code.replace("return\"\\\"+h.charCodeAt", "return\"\\\\\"+h.charCodeAt");

  // Fix motion pop rule quotes
  code = code.replace("data-motion-pop-id=\"\${o}\"", "data-motion-pop-id='\${o}'");

  // Fix error stack template string
  code = code.replace("c+=\"Caused by:", "c+=`Caused by:");
  code = code.replace(": \${P}\"", ": \${P}`");
  code = code.replace("c+=\"\${p.stack}\"", "c+=`\${p.stack}`");

  // Fix ws package workaround string quotes
  code = code.replaceAll("provide the \"ws\" package:", "provide the 'ws' package:");
  code = code.replaceAll("import ws from \"ws\"", "import ws from 'ws'");

  // Fix Reflect.get typeof r
  code = code.replace("typeof r===`function\"", "typeof r===\"function\"");

  // Fix onLog error message quotes
  code = code.replace("First argument to \"onLog\" must", "First argument to 'onLog' must");

  // Convert SQL setup block back to clean template literal
  const sqlPos = code.indexOf("DROP POLICY IF EXISTS");
  if (sqlPos !== -1) {
    const startQuote = code.lastIndexOf("=\"", sqlPos);
    const endQuote = code.indexOf("\";", sqlPos);
    if (startQuote !== -1 && endQuote !== -1) {
      let rawSql = code.substring(startQuote + 2, endQuote);
      rawSql = rawSql.replaceAll("\\\"","\"");
      code = code.substring(0, startQuote + 1) + "`" + rawSql + "`" + code.substring(endQuote + 1);
      console.log("✅ Fixed SQL template string block!");
    }
  }

  // Replace web worker nde script with clean single-line string
  const ndeStart = code.indexOf("const nde=");
  const ndeEnd = code.indexOf(";class rde{", ndeStart);
  if (ndeStart !== -1 && ndeEnd !== -1) {
    code = code.substring(0, ndeStart) + "const nde=\"addEventListener('message', (e) => { if (e.data.event === 'start') { setInterval(() => postMessage({ event: 'keepAlive' }), e.data.interval); } });\"" + code.substring(ndeEnd);
  }

  // Fix SIWE block
  const startPos = code.indexOf("w=s.statement");
  const endPos = code.indexOf("u){let P", startPos);
  if (startPos !== -1 && endPos !== -1) {
    const cleanSIWE = "w=s.statement?s.statement:\"\",A=\"\"+v+\" wants you to sign in with your Ethereum account:\"+x+w;let N=A+\"\\nURI: \"+p+\"\\nVersion: \"+g+\"\\nChain ID: \"+t+(o?\"\\nNonce: \"+o:\"\")+\"\\nIssued At: \"+a.toISOString();if(r&&(N+=\"\\nExpiration Time: \"+r.toISOString()),l&&(N+=\"\\nNot Before: \"+l.toISOString()),c&&(N+=\"\\nRequest ID: \"+c)),";
    const fixedSIWE = cleanSIWE.replace("+c)),", "+c),");
    code = code.substring(0, startPos) + fixedSIWE + code.substring(endPos);
  }

  // Fix logHandler TypeError string
  const pos = code.indexOf("must be a function");
  if (pos !== -1) {
    const sPos = code.lastIndexOf("throw new TypeError", pos);
    const ePos = code.indexOf(";this._logHandler=e}", pos);
    if (sPos !== -1 && ePos !== -1) {
      code = code.substring(0, sPos) + "throw new TypeError(\"Value assigned to logHandler must be a function\")" + code.substring(ePos);
    }
  }

  fs.writeFileSync(filePath, code, "utf8");

  try {
    acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" });
    console.log("🎉🎉🎉 SUCCESS! Acorn ESM syntax check PASSED 100% for " + filePath + "! ZERO SYNTAX ERRORS!");
  } catch (e) {
    console.error("❌ Acorn SyntaxError in " + filePath + ":", e.message, "at pos:", e.pos);
    if (e.pos) {
      console.error("Snippet:", JSON.stringify(code.substring(Math.max(0, e.pos - 80), e.pos + 80)));
    }
  }
}

fixFile("/app/applet/dist/assets/index-BTvWbti8.js");
fixFile("/app/applet/public/assets/index-BTvWbti8.js");
