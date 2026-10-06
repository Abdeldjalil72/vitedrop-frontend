const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/dashboard-layout.tsx', 'utf8');

// Imports
code = code.replace(
  'import React, { useState } from "react";',
  'import React, { useState, useEffect } from "react";\nimport { useRouter } from "next/navigation";\nimport { getCurrentUser } from "@/lib/api-client";'
);

// State and Guard
const guardCode = `  const [role, setRole] = useState<UserRole>(initialRole);
  const [lang, setLang] = useState<Language>(initialLang);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("/affiliate");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const expectedRole = initialRole.toUpperCase();
    if (user.role !== expectedRole) {
      const path = user.role === "ADMIN" ? "/admin" : user.role === "SUPPLIER" ? "/supplier" : "/affiliate";
      router.push(path);
      return;
    }

    setIsAuthorized(true);
  }, [router, initialRole]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin"></div>
      </div>
    );
  }

  const rtl = isRTL(lang);`;

code = code.replace(
  /  const \[role, setRole\] = useState<UserRole>\(initialRole\);[\s\S]*?const rtl = isRTL\(lang\);/m,
  guardCode
);

fs.writeFileSync('src/components/dashboard/dashboard-layout.tsx', code);
console.log('Global Dashboard Auth Guard injected.');
