const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const mobileBtns = `
                <div className="flex flex-col gap-2 w-full mt-4">
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
                </div>
`;

code = code.replace(
  '                <a\n                  href="https://wa.me/"',
  mobileBtns + '\n                <a\n                  href="https://wa.me/"'
);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Added auth buttons to mobile menu');
