import { FuturisticCard } from "@/components/ui/card"

interface DashboardHeaderProps {
  totalSaldo: number
  totalEmpenhado: number
  percentualExecutado: number
  percentualExecutadoTotal: number
  mes: string
  ano: number
  projecaoFinalAno: number
}

export function DashboardHeader({ 
  totalSaldo, 
  totalEmpenhado, 
  percentualExecutado,
  percentualExecutadoTotal,
  mes, 
  ano, 
  projecaoFinalAno
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Orçamentário</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground">
          {mes} / {ano}
        </h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <FuturisticCard title="Orçamento Atual">
          <p className="text-sm font-medium text-muted-foreground">Orçamento Atual</p>
          <p className="text-2xl font-bold">
            {totalSaldo.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              minimumFractionDigits: 0
            })}
          </p>
        </FuturisticCard>
        
        <FuturisticCard title="Total Empenhado">
          <p className="text-sm font-medium text-muted-foreground">Total Empenhado</p>
          <p className="text-2xl font-bold">
            {totalEmpenhado.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              minimumFractionDigits: 0
            })}
          </p>
        </FuturisticCard>

        <FuturisticCard title="Projeção Orçamento">
          <p className="text-sm font-medium text-muted-foreground">Projeção Orçamento</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {projecaoFinalAno.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </p>
            <p className="text-lg font-medium">
              {percentualExecutadoTotal.toFixed(1)}%
            </p>
          </div>
        </FuturisticCard>
      </div>
    </div>
  )
}