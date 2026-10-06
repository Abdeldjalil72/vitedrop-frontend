const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// Imports
code = code.replace(
  'import { getCurrentUser } from "@/lib/api-client";',
  'import { getCurrentUser, apiGetAdminStats, apiGetPendingWithdrawals } from "@/lib/api-client";'
);

// State and effect
const stateToAdd = `
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    totalOrders: 0,
    totalSupplierEscrow: 0,
    totalAffiliateLiability: 0,
    platformRevenue: 0,
  });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, withdrawalsData] = await Promise.all([
          apiGetAdminStats(),
          apiGetPendingWithdrawals(),
        ]);
        setStats(statsData);
        setWithdrawals(withdrawalsData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);
`;

code = code.replace(
  '  const pendingWithdrawals = [',
  stateToAdd + '\n  const pendingWithdrawals = ['
);

// Replace hardcoded values with stats
code = code.replace('Escrow Pool: 1,420,000 DZD', 'Escrow Pool: {formatDZD(stats.totalSupplierEscrow, lang)}');
code = code.replace('{formatDZD(284000, lang)}', '{formatDZD(stats.platformRevenue, lang)}');
code = code.replace('{formatDZD(73000, lang)}', '{formatDZD(stats.totalAffiliateLiability, lang)}');
code = code.replace('342', '{stats.totalAffiliates}');
code = code.replace('18', '{stats.totalOrders} / 50');

// Replace pending withdrawals rendering
code = code.replace(
  /\{pendingWithdrawals\.map\(\(w\) => \([\s\S]*?\}\)\)\}/m,
  `{withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-mono text-xs font-bold text-neutral-900">
                          {w.id.slice(0, 8)}
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
                            <span className="text-[11px] font-mono text-[#6b6b6b]">{w.referenceId}</span>
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
                            <Button size="sm" className="text-[11px] px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valider Virement</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}`
);

code = code.replace(/\{pendingWithdrawals\.length\}/g, '{withdrawals.length}');

fs.writeFileSync('src/app/admin/page.tsx', code);
console.log('Admin page modified');
