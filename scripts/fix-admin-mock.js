const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// 1. Remove the pendingWithdrawals mock array
code = code.replace(
  /  const pendingWithdrawals = \[\s*\{[\s\S]*?\}\s*\];/m,
  ''
);

// 2. Remove the pendingProducts mock array
code = code.replace(
  /  const pendingProducts = \[\s*\{[\s\S]*?\}\s*\];/m,
  ''
);

// 3. Fix the mapping for withdrawals to use state
const newWithdrawalsMap = `{withdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-neutral-500">
                          {isAr ? "لا توجد طلبات سحب معلقة" : "Aucune demande de retrait"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-mono text-xs font-bold text-neutral-900">
                            {w.id.slice(0,8)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-neutral-900">{w.fullName}</span>
                              <span className="text-[11px] text-[#6b6b6b]">{w.role}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-neutral-900">Virement</span>
                              <span className="text-[11px] font-mono text-[#6b6b6b]">{w.reference}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-emerald-600">
                            {formatDZD(w.amount, lang)}
                          </TableCell>
                          <TableCell className="text-xs text-[#6b6b6b] font-mono">
                             {new Date(w.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="danger" size="sm" className="text-[11px] px-2.5 py-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rejeter</span>
                              </Button>
                              <Button size="sm" className="text-[11px] px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Valider Virement</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}`;

code = code.replace(
  /\{pendingWithdrawals\.map\(\(w\) => \([\s\S]*?\}\)\)\}/m,
  newWithdrawalsMap
);

// 4. Update the badges in the tabs to use state lengths
// wait, the code says pendingWithdrawals.length
code = code.replace(/pendingWithdrawals\.length/g, 'withdrawals.length');
code = code.replace(/pendingProducts\.length/g, '0');

// 5. Empty State for products tab
const emptyProducts = `{/* Products are now fully native via Supplier Dashboard. Admin approval can be added here later. */}
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-neutral-500">
                         Aucun produit en attente
                      </TableCell>
                    </TableRow>`;

code = code.replace(
  /\{pendingProducts\.map\(\(p\) => \([\s\S]*?\}\)\)\}/m,
  emptyProducts
);

fs.writeFileSync('src/app/admin/page.tsx', code);
console.log('Admin mock data removed and mapped to live state.');
