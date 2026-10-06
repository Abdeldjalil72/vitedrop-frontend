const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!code.includes('import { getCurrentUser, DecodedToken }')) {
  code = code.replace(
    'import Link from "next/link";',
    'import Link from "next/link";\nimport { getCurrentUser, DecodedToken } from "@/lib/api-client";\nimport { useEffect } from "react";'
  );
}

if (!code.includes('const [currentUser, setCurrentUser]')) {
  code = code.replace(
    'const [pageLang, setPageLang] = useState<"en" | "fr" | "ar">("en");',
    `const [pageLang, setPageLang] = useState<"en" | "fr" | "ar">("en");\n  const [currentUser, setCurrentUser] = useState<DecodedToken | null>(null);\n\n  useEffect(() => {\n    setCurrentUser(getCurrentUser());\n  }, []);`
  );
}

// Replace Desktop Auth Buttons
const desktopAuthRegex = /\{\/\* Auth Buttons \*\/\}\s*<div className="hidden md:flex items-center gap-1\.5 border-l border-black\/\[0\.06\] pl-3 mr-1">[\s\S]*?<\/div>/m;
const dynamicDesktopAuth = `{/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-1.5 border-l border-black/[0.06] pl-3 mr-1">
              {currentUser ? (
                <Link href={currentUser.role === "SUPPLIER" ? "/supplier" : currentUser.role === "ADMIN" ? "/admin" : "/affiliate"} className="text-sm font-semibold text-white bg-black hover:bg-neutral-800 transition-colors px-5 py-2 rounded-full flex items-center gap-2">
                  {pageLang === 'ar' ? 'لوحة التحكم' : (pageLang === 'fr' ? 'Tableau de Bord' : 'Dashboard')}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
              ) : (
                <React.Fragment>
                  <Link href="/login" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors px-3 py-2 rounded-xl hover:bg-neutral-50">
                    {pageLang === 'ar' ? 'تسجيل الدخول' : (pageLang === 'fr' ? 'Connexion' : 'Login')}
                  </Link>
                  <Link href="/signup" className="text-sm font-semibold text-white bg-black hover:bg-neutral-800 transition-colors px-4 py-2 rounded-full">
                    {pageLang === 'ar' ? 'إنشاء حساب' : (pageLang === 'fr' ? "S'inscrire" : 'Sign Up')}
                  </Link>
                </React.Fragment>
              )}
            </div>`;

code = code.replace(desktopAuthRegex, dynamicDesktopAuth);

// Replace Mobile Auth Buttons
const mobileAuthRegex = /<div className="flex flex-col gap-2 w-full mt-4">[\s\S]*?<\/div>/m;
const dynamicMobileAuth = `<div className="flex flex-col gap-2 w-full mt-4">
                  {currentUser ? (
                    <Link
                      href={currentUser.role === "SUPPLIER" ? "/supplier" : currentUser.role === "ADMIN" ? "/admin" : "/affiliate"}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-all"
                    >
                      {pageLang === 'ar' ? 'الذهاب إلى لوحة التحكم' : (pageLang === 'fr' ? 'Aller au Tableau de Bord' : 'Go to Dashboard')}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                  ) : (
                    <React.Fragment>
                      <Link
                        href="/login"
                        className="w-full text-center px-5 py-3 rounded-xl border border-black/10 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-all"
                      >
                        {pageLang === 'ar' ? 'تسجيل الدخول' : (pageLang === 'fr' ? 'Connexion' : 'Login')}
                      </Link>
                      <Link
                        href="/signup"
                        className="w-full text-center px-5 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-all"
                      >
                        {pageLang === 'ar' ? 'إنشاء حساب' : (pageLang === 'fr' ? "S'inscrire" : 'Sign Up')}
                      </Link>
                    </React.Fragment>
                  )}
                </div>`;

code = code.replace(mobileAuthRegex, dynamicMobileAuth);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Made auth buttons dynamic based on login state.');
