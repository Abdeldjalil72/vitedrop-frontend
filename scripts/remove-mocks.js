const fs = require('fs');

// 1. Affiliate Page
let affPage = fs.readFileSync('src/app/affiliate/page.tsx', 'utf8');
affPage = affPage.replace(
  /\} else \{\s*\/\/ Fallback seed\s*setOrders\(\[[\s\S]*?\]\);\s*\}/,
  '} else { setOrders([]); }'
);
fs.writeFileSync('src/app/affiliate/page.tsx', affPage);
console.log('Cleaned affiliate/page.tsx');

// 2. Affiliate Wallet
let affWallet = fs.readFileSync('src/app/affiliate/wallet/page.tsx', 'utf8');
affWallet = affWallet.replace(
  /\} else \{\s*setWallet\(\{ id: "mock-wallet"[\s\S]*?\}\);\s*\}/,
  '} else { setWallet({ id: "mock-wallet", balance: 0, ownerType: "AFFILIATE" }); }'
);
affWallet = affWallet.replace(
  /\} else \{\s*\/\/ Fallback sample transactions\s*setTransactions\(\[[\s\S]*?\]\);\s*\}/,
  '} else { setTransactions([]); }'
);
fs.writeFileSync('src/app/affiliate/wallet/page.tsx', affWallet);
console.log('Cleaned affiliate/wallet/page.tsx');

// 3. Supplier Wallet
let supWallet = fs.readFileSync('src/app/supplier/wallet/page.tsx', 'utf8');
supWallet = supWallet.replace(
  /\} else \{\s*setWallet\(\{ id: "mock-wallet"[\s\S]*?\}\);\s*\}/,
  '} else { setWallet({ id: "mock-wallet", balance: 0, ownerType: "SUPPLIER" }); }'
);
supWallet = supWallet.replace(
  /\} else \{\s*setTransactions\(\[[\s\S]*?\]\);\s*\}/,
  '} else { setTransactions([]); }'
);
fs.writeFileSync('src/app/supplier/wallet/page.tsx', supWallet);
console.log('Cleaned supplier/wallet/page.tsx');
