const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /\{\/\* Menu Button \/ CTA \/ Language \*\/\}[\s\S]*?<\/nav>/m;

const replacement = `{/* Menu Button / CTA / Language */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#f4f4f4] transition-colors text-sm font-semibold text-black"
              >
                <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {pageLang.toUpperCase()}
                <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-black/[0.06] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
                <button onClick={() => setPageLang("en")} className={\`w-full text-start px-4 py-2 text-sm font-medium hover:bg-neutral-50 \${pageLang === "en" ? "text-sky-600" : "text-black"}\`}>English</button>
                <button onClick={() => setPageLang("fr")} className={\`w-full text-start px-4 py-2 text-sm font-medium hover:bg-neutral-50 \${pageLang === "fr" ? "text-sky-600" : "text-black"}\`}>Français</button>
                <button onClick={() => setPageLang("ar")} className={\`w-full text-start px-4 py-2 text-sm font-medium hover:bg-neutral-50 \${pageLang === "ar" ? "text-sky-600" : "text-black"}\`}>العربية</button>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-1.5 border-l border-black/[0.06] pl-3 mr-1">
              <Link href="/login" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors px-3 py-2 rounded-xl hover:bg-neutral-50">
                {pageLang === 'ar' ? 'تسجيل الدخول' : (pageLang === 'fr' ? 'Connexion' : 'Login')}
              </Link>
              <Link href="/signup" className="text-sm font-semibold text-white bg-black hover:bg-neutral-800 transition-colors px-4 py-2 rounded-full">
                {pageLang === 'ar' ? 'إنشاء حساب' : (pageLang === 'fr' ? "S'inscrire" : 'Sign Up')}
              </Link>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#2563eb] text-white text-[14px] font-medium px-5 py-2.5 rounded-full shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 hover:brightness-105 transition-all"
              aria-label="Toggle navigation drawer"
            >
              <span>{isMenuOpen ? t.closeLabel : t.navMenu}</span>
              <svg
                className={\`w-3.5 h-3.5 transition-transform duration-300 \${
                  isMenuOpen ? "rotate-180" : ""
                }\`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
          </div>
        </div>
      </nav>`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Navbar updated successfully');
