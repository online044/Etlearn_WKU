import React from "react";
import ReactDOMServer from "react-dom/server";

const mockProfile: any = {
  id: "student_1",
  name: "Abebe Kebede",
  email: "abebe@wku.edu.et",
  university: "Wolkite University",
  department: "Freshman Common Courses",
  year: "Freshman",
  isRegistered: true,
  isPro: false,
  proStatus: "free",
  subjects: ["General Biology", "General Chemistry"]
};

function findButtonPaths(html: string) {
  const tagRegex = /<\/?([a-zA-Z0-9\-]+)([^>]*)>/g;
  let stack: { tag: string; id?: string; nthOfType: number }[] = [];
  let siblingsAtDepth: Record<number, Record<string, number>> = {};
  let buttons: { path: string; html: string }[] = [];

  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const isClosing = match[0].startsWith("</");
    const tagName = match[1].toLowerCase();
    const attrs = match[2];
    const isSelfClosing = match[0].endsWith("/>") || ["img", "input", "br", "hr"].includes(tagName);

    if (isClosing) {
      if (stack.length > 0) {
        delete siblingsAtDepth[stack.length];
        stack.pop();
      }
    } else {
      const depth = stack.length;
      if (!siblingsAtDepth[depth]) siblingsAtDepth[depth] = {};
      siblingsAtDepth[depth][tagName] = (siblingsAtDepth[depth][tagName] || 0) + 1;
      const nth = siblingsAtDepth[depth][tagName];

      const idMatch = attrs.match(/id=["']([^"']+)["']/);
      const idStr = idMatch ? "#" + idMatch[1] : "";

      const currentPath = stack.map(s => `${s.tag}${s.id ? s.id : ""}:nth-of-type(${s.nthOfType})`).join(" > ") + 
        (stack.length > 0 ? " > " : "") + `${tagName}${idStr}:nth-of-type(${nth})`;

      if (tagName === "button") {
        buttons.push({ path: currentPath, html: match[0] });
      }

      if (!isSelfClosing) {
        stack.push({ tag: tagName, id: idStr, nthOfType: nth });
      }
    }
  }
  return buttons;
}

const comps: Record<string, any> = {
  HomeDashboard: React.createElement(require("./src/components/HomeDashboard").default, { profile: mockProfile, language: "en", onNavigate: () => {}, streakCount: 5, studyHoursCount: 10 }),
  UpgradeProView: React.createElement(require("./src/components/UpgradeProView").default, { profile: mockProfile, language: "en", onUpdateProfile: () => {} }),
  StudyNotesView: React.createElement(require("./src/components/StudyNotesView").default, { customNotes: [], onSaveCustomNotes: () => {}, enrolledSubjects: [], googleUser: null, googleToken: null, onGoogleSignIn: async () => {}, onGoogleSignOut: async () => {}, language: "en" }),
  BookStoreView: React.createElement(require("./src/components/BookStoreView").default, { profile: mockProfile, language: "en", onNavigate: () => {}, onStudyAction: () => {} }),
  UniversityExamsView: React.createElement(require("./src/components/UniversityExamsView").default, { profile: mockProfile, language: "en", onNavigate: () => {}, onStudyAction: () => {} }),
  ExamPrep: React.createElement(require("./src/components/ExamPrep").default, { enrolledSubjects: [], onStudyAction: () => {}, onNavigateBack: () => {}, isPro: false, onNavigateToUpgrade: () => {} }),
  StudentProfileView: React.createElement(require("./src/components/StudentProfileView").default, { profile: mockProfile, language: "en", onUpdateProfile: () => {}, streakCount: 5, studyHoursCount: 10 })
};

const target = "div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > button:nth-of-type(1)";

for (const [name, el] of Object.entries(comps)) {
  const innerHtml = ReactDOMServer.renderToString(el);
  const html = `<div id="root"><div><main><div>${innerHtml}</div></main></div></div>`;
  const paths = findButtonPaths(html);
  for (const b of paths) {
    if (b.path === target || b.path.includes("div:nth-of-type(1) > button:nth-of-type(1)")) {
      console.log(`MATCH [${name}] Path: ${b.path} HTML: ${b.html}`);
    }
  }
}
