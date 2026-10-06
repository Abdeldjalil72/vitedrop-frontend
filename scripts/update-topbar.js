const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/topbar.tsx', 'utf8');

const regex = /\{\/\* Language Switcher \*\/\}[\s\S]*?<\/div>/;

const dropdown = `{/* Language Switcher */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#f4f4f4] transition-colors text-xs font-semibold text-black"
          >
            <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {lang.toUpperCase()}
            <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-xl shadow-xl border border-black/[0.06] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
            <button onClick={() => onLangChange("en")} className={\`w-full text-start px-4 py-2 text-xs font-medium hover:bg-neutral-50 \${lang === "en" ? "text-sky-600" : "text-black"}\`}>English</button>
            <button onClick={() => onLangChange("fr")} className={\`w-full text-start px-4 py-2 text-xs font-medium hover:bg-neutral-50 \${lang === "fr" ? "text-sky-600" : "text-black"}\`}>Français</button>
            <button onClick={() => onLangChange("ar")} className={\`w-full text-start px-4 py-2 text-xs font-medium hover:bg-neutral-50 \${lang === "ar" ? "text-sky-600" : "text-black"}\`}>العربية</button>
          </div>
        </div>`;

code = code.replace(regex, dropdown);

fs.writeFileSync('src/components/dashboard/topbar.tsx', code);
console.log('Updated topbar language dropdown');
