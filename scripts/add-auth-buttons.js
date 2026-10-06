const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!code.includes('import Link')) {
  code = code.replace(
    'import { pageTranslations } from "./locales";',
    'import { pageTranslations } from "./locales";\nimport Link from "next/link";'
  );
}

const ctas = `            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <Link href="/login" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors px-3 py-2">
                {pageLang === 'ar' ? 'تسجيل الدخول' : (pageLang === 'fr' ? 'Connexion' : 'Login')}
              </Link>
              <Link href="/signup" className="text-sm font-semibold text-white bg-black hover:bg-neutral-800 transition-colors px-4 py-2 rounded-full">
                {pageLang === 'ar' ? 'إنشاء حساب' : (pageLang === 'fr' ? "S'inscrire" : 'Sign Up')}
              </Link>
            </div>
`;

code = code.replace(
  '            {/* Main Language Pill */}',
  ctas + '\n            {/* Main Language Pill */}'
);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Added auth buttons');
