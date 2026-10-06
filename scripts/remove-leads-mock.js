const fs = require('fs');
let leads = fs.readFileSync('src/app/affiliate/leads/page.tsx', 'utf8');
leads = leads.replace(
  /\} else \{\s*\/\/ Fallback seed[\s\S]*?\]\);\s*\}/,
  '} else { setOrders([]); }'
);
fs.writeFileSync('src/app/affiliate/leads/page.tsx', leads);
console.log('Cleaned affiliate/leads/page.tsx');
