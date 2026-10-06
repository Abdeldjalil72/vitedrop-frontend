const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const startIdx = code.indexOf('if (!isAuthorized) {');
const endIdx = code.indexOf('  return (\n    <DashboardLayout');

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `if (!isAuthorized) {
    return null;
  }

  const tabs = [
    { id: "withdrawals", label: "Retraits en attente", count: withdrawals.length },
    { id: "products", label: "Approbation Produits", count: 0 },
    { id: "disputes", label: "Litiges", count: 0 },
  ];

`;
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
  fs.writeFileSync('src/app/admin/page.tsx', code);
  console.log('Successfully removed mock arrays!');
} else {
  console.log('Indices not found', startIdx, endIdx);
}
