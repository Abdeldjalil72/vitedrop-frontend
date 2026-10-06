const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// Strip out the early return
code = code.replace(
`  if (!isAuthorized) {
    return null; // or a loading spinner
  }`, 
  ''
);

// We want to insert the early return right after the loadData useEffect hook
const insertionPoint = `    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);`;

code = code.replace(
  insertionPoint,
  insertionPoint + '\n\n  if (!isAuthorized) {\n    return null;\n  }'
);

fs.writeFileSync('src/app/admin/page.tsx', code);
console.log('Fixed hooks order in admin page.');
