'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { agregadorUnidadeOrcamentaria, agregadorFonteRecurso, agregadorElementoDespesa } from './agregadores'
import { calcularProjecaoEmpenho, processarDadosHistoricos, DadoHistoricoAgregado } from '@/utils/projecao';
import { TabelaProjecao } from './tabela-projecao';
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { DashboardHeader } from '@/components/ui/header'

interface ValoresAgregados {
    total_orcado: number
    total_saldo: number
    total_empenhado: number
  }
  
  interface DespesasPorUnidade {
    unidade_orcamentaria: string
    valores: ValoresAgregados
  }
  
  interface DespesasPorFonte {
    fonte_de_recurso: string
    valores: ValoresAgregados
  }
  
  interface DespesasPorElemento {
    elemento_despesa: string
    valores: ValoresAgregados
  }
  
  interface ReceitaPorDescricao {
    descricao: string
    total_orcado: number
    total_saldo: number
    total_receita: number
  }
  
  interface ReceitaPorFonte {
    fonte_de_recurso: string
    total_orcado: number
    total_saldo: number
    total_receita: number
  }

interface MonthOption {
  value: number
  label: string
}

const months: MonthOption[] = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
]

interface YearOption {
  value: number
  label: string
}

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const years: YearOption[] = Array.from({ length: 6 }, (_, index) => ({
  value: currentYear - index,
  label: String(currentYear - index)
}))

async function fetchAllDespesas(supabase: any, user_id: string, month: number) {
  let allData: any[] = [];
  let hasMore = true;
  let page = 0;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('Despesas')
      .select('*')
      .eq('user_id', user_id)
      .eq('mes', month)
      .range(page * 1000, (page + 1) * 1000 - 1);
      
    if (error) throw error;
    
    allData = [...allData, ...data];
    hasMore = data.length === 1000;
    page++;
  }
  
  return allData;
}

function DashboardContent() {
  const [despesasPorUnidade, setDespesasPorUnidade] = useState<DespesasPorUnidade[]>([])
  const [despesasPorFonte, setDespesasPorFonte] = useState<DespesasPorFonte[]>([])
  const [despesasPorElemento, setDespesasPorElemento] = useState<DespesasPorElemento[]>([])
  const [receitasPorDescricao, setReceitasPorDescricao] = useState<ReceitaPorDescricao[]>([])
  const [receitasPorFonte, setReceitasPorFonte] = useState<ReceitaPorFonte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [dadosHistoricos, setDadosHistoricos] = useState<DadoHistoricoAgregado[]>([])
  const [showDetails, setShowDetails] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const user_id = searchParams.get('user_id')

  // Calculate totals for the header
  const totals = useMemo(() => {
    const totalOrcado = despesasPorElemento.reduce((sum, item) => 
      sum + item.valores.total_orcado, 0
    );
    const totalEmpenhado = despesasPorElemento.reduce((sum, item) => 
      sum + item.valores.total_empenhado, 0
    );
    const percentualExecutado = totalOrcado ? (totalEmpenhado / totalOrcado) * 100 : 0;

    return {
      totalOrcado,
      totalEmpenhado,
      percentualExecutado
    };
  }, [despesasPorElemento]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10)
    setSelectedMonth(isNaN(value) ? 0 : value)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10)
    setSelectedYear(isNaN(value) ? currentYear : value)
  }

  useEffect(() => {
    async function fetchData() {
      // Ensure selectedMonth is a valid integer
      const parsedSelectedMonth = Number(selectedMonth)
      if (isNaN(parsedSelectedMonth)) {
        setError('Invalid month selected.')
        setLoading(false)
        return
      }


      if (!user_id) {
        setError('No user ID provided')
        setLoading(false)
        return
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // // First fetch all available years
        // const { data: rawYearsData, error: yearsError } = await supabase
        //   .from('Despesas')
        //   .select('ano')
        //   .eq('user_id', user_id)

        // if (yearsError) throw new Error(`Error fetching years: ${yearsError.message}`)
        
        // Then use these years in the main query
        const [despesasData, despesas12Data, receitasData] = await Promise.all([
          fetchAllDespesas(supabase, user_id, selectedMonth),
          selectedMonth !== 12 && fetchAllDespesas(supabase, user_id, 12),
          supabase
            .from('Receitas')
            .select('*')
            .eq('user_id', user_id)
            .eq('mes', Number(selectedMonth))
            .eq('ano', Number(selectedYear))
            .range(0, 999),
        ])
        const processedDespesas = despesasData || [];
        // Combine all despesas data for historical analysis
        const combinedDespesas = [
          ...(processedDespesas),
          ...(despesas12Data || [])
        ];

        // Filter data for display tables to show only selected month and year
        const despesasDisplay = processedDespesas.filter(
          d => d.ano === Number(selectedYear)
        );

        console.log('Receitas fetched meses:', receitasData.data?.map(d => d.mes))
        console.log('Despesas Display:', despesasDisplay)

        // Process dashboard data for display
        // Agregar despesas por Unidade Orçamentária
        const unidadeMap = new Map<string, ValoresAgregados>();
        despesasDisplay.forEach((d) => {
          const mappedUnidade = agregadorUnidadeOrcamentaria[String(d.unidade_orcamentaria)] || d.unidade_orcamentaria;
          const existing = unidadeMap.get(mappedUnidade) || { 
            total_orcado: 0, 
            total_saldo: 0, 
            total_empenhado: 0 
          };
          
          const orcado = (d.orcado || 0);
          const saldo = (d.saldo || 0);
          const empenhado = (d.empenhado || 0);

          unidadeMap.set(mappedUnidade, {
            total_orcado: existing.total_orcado + orcado,
            total_saldo: existing.total_saldo + saldo,
            total_empenhado: existing.total_empenhado + empenhado
          });
        });

         // Agregar despesas por Fonte de Recurso
         const fonteMap = new Map<string, ValoresAgregados>()
         despesasDisplay.forEach((d) => {
          // Get the mapped fonte or use the original if no mapping exists
          const mappedFonte = agregadorFonteRecurso[String(d.fonte_de_recurso)] || d.fonte_de_recurso
          
          const existing = fonteMap.get(mappedFonte) || { 
            total_orcado: 0, 
            total_saldo: 0, 
            total_empenhado: 0 
        }
  
          fonteMap.set(mappedFonte, {
            total_orcado: existing.total_orcado + d.orcado,
            total_saldo: existing.total_saldo + d.saldo,
            total_empenhado: existing.total_empenhado + d.empenhado
          })
        })
 
         // Agregar despesas por Elemento
         const elementoMap = new Map<string, ValoresAgregados>()
         despesasDisplay.forEach((d) => {
            // Get the mapped elemento or use the original if no mapping exists
            const mappedElemento = agregadorElementoDespesa[String(d.elemento_despesa)] || d.elemento_despesa
            
            const existing = elementoMap.get(mappedElemento) || { 
                total_orcado: 0, 
                total_saldo: 0, 
                total_empenhado: 0 
            }
            
            elementoMap.set(mappedElemento, {
                total_orcado: existing.total_orcado + d.orcado,
                total_saldo: existing.total_saldo + d.saldo,
                total_empenhado: existing.total_empenhado + d.empenhado
            })
          })

            // Transform the Map into an array for rendering
          //   const despesasPorElemento = Array.from(elementoMap.entries()).map(([elemento_despesa, valores]) => ({
          //   elemento_despesa,
          //   valores
          // }))
 
         // Agregar receitas por Descrição
         const descricaoMap = new Map<string, { total_orcado: number, total_saldo: number, total_receita: number }>()
         receitasData.data?.forEach((r) => {
           const existing = descricaoMap.get(r.descricao) || { total_orcado: 0, total_saldo: 0, total_receita: 0 }
           descricaoMap.set(r.descricao, {
             total_orcado: existing.total_orcado + r.orcado,
             total_saldo: existing.total_saldo + r.saldo,
             total_receita: existing.total_receita + (r.receita)  // Garantindo que arrecadado existe
           })
         })
 
         const receitaFonteMap = new Map<string, { total_orcado: number, total_saldo: number, total_receita: number }>()
         receitasData.data?.forEach((r) => {
           const mappedFonte = agregadorFonteRecurso[String(r.fonte_de_recurso)] || r.fonte_de_recurso
           
           const existing = receitaFonteMap.get(mappedFonte) || { 
             total_orcado: 0, 
             total_saldo: 0, 
             total_receita: 0 
           }
           
           receitaFonteMap.set(mappedFonte, {
             total_orcado: existing.total_orcado + r.orcado,
             total_saldo: existing.total_saldo + r.saldo,
             total_receita: existing.total_receita + r.receita
           })
         })
 
         // Ordenar despesas por unidade (pelo total orçado)
         setDespesasPorUnidade(
           Array.from(unidadeMap.entries())
             .map(([unidade, valores]) => ({
               unidade_orcamentaria: unidade,
               valores
             }))
             .sort((a, b) => b.valores.total_orcado - a.valores.total_orcado)
         )
         setDespesasPorFonte(Array.from(fonteMap.entries()).map(([fonte, valores]) => ({
           fonte_de_recurso: fonte,
           valores
         })))
         setDespesasPorElemento(Array.from(elementoMap.entries()).map(([elemento, valores]) => ({
           elemento_despesa: elemento,
           valores
         })))
         setReceitasPorDescricao(
           Array.from(descricaoMap.entries())
             .map(([descricao, valores]) => ({
               descricao,
               total_orcado: valores.total_orcado,
               total_saldo: valores.total_saldo,
               total_receita: valores.total_receita
             }))
             .sort((a, b) => b.total_orcado - a.total_orcado)
         )
         setReceitasPorFonte(
           Array.from(receitaFonteMap.entries())
             .map(([fonte, valores]) => ({
               fonte_de_recurso: fonte,
               total_orcado: valores.total_orcado,
               total_saldo: valores.total_saldo,
               total_receita: valores.total_receita
             }))
             .sort((a, b) => b.total_orcado - a.total_orcado)
         )

        // Process historical data
        const dadosAgregados = processarDadosHistoricos(combinedDespesas, selectedYear);
        console.log('Dados Historicos:', combinedDespesas)
        setDadosHistoricos(dadosAgregados);

      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user_id, selectedMonth, selectedYear])

  // Preparar dados para a tabela de projeção
  const dadosProjecao = despesasPorElemento.map(item => ({
    ...item,
    analise: calcularProjecaoEmpenho(
      dadosHistoricos,
      selectedMonth,
      item.valores.total_empenhado,
      item.valores.total_saldo,
      selectedYear
    )
  }))

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>Error: {error}</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Return to Home
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <p>Carregando...</p>
        <p className="text-sm text-gray-500">User ID: {user_id}</p>
      </div>
    )
  }

  if (!despesasPorUnidade.length && !receitasPorDescricao.length && selectedMonth === 0) {
    return (
      <div className="p-4 text-center">
        <p>Nenhum dado encontrado para este usuário.</p>
        <p className="text-sm text-gray-500">User ID: {user_id}</p>
        <button 
          onClick={() => router.push('/protected')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retornar
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Top Actions Row */}
      <div className="flex justify-between items-center">
        <div className="flex justify-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-center">Ano</h2>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-32 rounded-md border border-input bg-background px-3 py-2"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-center">Mês</h2>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="w-32 rounded-md border border-input bg-background px-3 py-2"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Link 
          href={'/protected'}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Inserir Dados
        </Link>
      </div>

      {/* Header with statistics */}
      <DashboardHeader 
        totalOrcado={totals.totalOrcado}
        totalEmpenhado={totals.totalEmpenhado}
        percentualExecutado={totals.percentualExecutado}
        mes={months.find(m => m.value === selectedMonth)?.label || ''}
        ano={selectedYear}
      />

      {/* Main content sections */}
      <div className="space-y-16">
        {/* Projection Table */}
        <div className="bg-card rounded-lg shadow-sm">
          <TabelaProjecao 
            dados={dadosProjecao} 
            selectedMonth={selectedMonth} 
          />
        </div>

        {/* Collapsible Details Section */}
        <div className="space-y-4">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ocultar Detalhes
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostrar Detalhes
              </>
            )}
          </Button>

          {showDetails && (
            <div className="space-y-8">
              {/* Despesas por Unidade */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Despesas por Unidade Orçamentária</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Unidade Orçamentária</th>
                        <th className="text-right p-4">Orçado</th>
                        <th className="text-right p-4">Saldo</th>
                        <th className="text-right p-4">Empenhado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesasPorUnidade.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-4">{item.unidade_orcamentaria}</td>
                          <td className="text-right p-4">
                            {item.valores.total_orcado.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                          <td className="text-right p-4">
                            {item.valores.total_saldo.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                          <td className="text-right p-4">
                            {item.valores.total_empenhado.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Despesas por Fonte */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Despesas por Fonte de Recurso</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Fonte de Recurso</th>
                        <th className="text-right p-4">Orçado</th>
                        <th className="text-right p-4">Saldo</th>
                        <th className="text-right p-4">Empenhado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesasPorFonte.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-4">{item.fonte_de_recurso}</td>
                          <td className="text-right p-4">
                            {item.valores.total_orcado.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                          <td className="text-right p-4">
                            {item.valores.total_saldo.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                          <td className="text-right p-4">
                            {item.valores.total_empenhado.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Despesas por Elemento */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Despesas por Elemento</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Elemento da Despesa</th>
                        <th className="text-right p-4">Orçado</th>
                        <th className="text-right p-4">Saldo</th>
                        <th className="text-right p-4">Empenhado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesasPorElemento.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-4">{item.elemento_despesa}</td>
                          <td className="text-right p-4">
                            {item.valores.total_orcado.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                          <td className="text-right p-4">
                            {item.valores.total_saldo.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                          <td className="text-right p-4">
                            {item.valores.total_empenhado.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receitas por Fonte */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Receitas por Fonte de Recurso</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Fonte de Recurso</th>
                        <th className="text-right p-4">Orçado</th>
                        <th className="text-right p-4">Saldo</th>
                        <th className="text-right p-4">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receitasPorFonte.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-4">{item.fonte_de_recurso}</td>
                          <td className="text-right p-4">
                            {item.total_orcado.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                          <td className="text-right p-4">
                            {item.total_saldo.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                          <td className="text-right p-4">
                            {item.total_receita.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receitas por Descrição with scroll */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Receitas por Descrição</h2>
                <div className="overflow-x-auto">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-card z-10 shadow-sm">
                        <tr className="border-b">
                          <th className="text-left p-4">Descrição</th>
                          <th className="text-right p-4">Orçado</th>
                          <th className="text-right p-4">Saldo</th>
                          <th className="text-right p-4">Receita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receitasPorDescricao.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-4">{item.descricao}</td>
                            <td className="text-right p-4">
                              {item.total_orcado.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL',
                                minimumFractionDigits: 0
                              })}
                            </td>
                            <td className="text-right p-4">
                              {item.total_saldo.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL',
                                minimumFractionDigits: 0
                              })}
                            </td>
                            <td className="text-right p-4">
                              {item.total_receita.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL',
                                minimumFractionDigits: 0
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente wrapper com Suspense
export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-4">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
