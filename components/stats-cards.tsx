import { Wallet, FileText, CheckCircle2, ArrowUpRight } from "lucide-react"

interface StatsCardsProps {
  treasuryBalance: string
  totalProposals: number
  readyProposals: number
  releasedProposals: number
}

export function StatsCards({
  treasuryBalance,
  totalProposals,
  readyProposals,
  releasedProposals,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Treasury Balance",
      value: `${Number(treasuryBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`,
      icon: Wallet,
      accent: "text-chart-2",
    },
    {
      label: "Total Proposals",
      value: totalProposals.toString(),
      icon: FileText,
      accent: "text-foreground",
    },
    {
      label: "Ready",
      value: readyProposals.toString(),
      icon: CheckCircle2,
      accent: "text-chart-2",
    },
    {
      label: "Released",
      value: releasedProposals.toString(),
      icon: ArrowUpRight,
      accent: "text-chart-3",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <stat.icon className={`h-5 w-5 ${stat.accent}`} />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-card-foreground">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  )
}
