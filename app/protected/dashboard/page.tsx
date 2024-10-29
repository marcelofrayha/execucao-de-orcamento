'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { agregadorUnidadeOrcamentaria, agregadorFonteRecurso, agregadorElementoDespesa } from './agregadores'

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
  { value: 0, label: 'Todos os Meses' },
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

function DashboardContent() {
  const [despesasPorUnidade, setDespesasPorUnidade] = useState<DespesasPorUnidade[]>([])
  const [despesasPorFonte, setDespesasPorFonte] = useState<DespesasPorFonte[]>([])
  const [despesasPorElemento, setDespesasPorElemento] = useState<DespesasPorElemento[]>([])
  const [receitasPorDescricao, setReceitasPorDescricao] = useState<ReceitaPorDescricao[]>([])
  const [receitasPorFonte, setReceitasPorFonte] = useState<ReceitaPorFonte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(0)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const user_id = searchParams.get('user_id')

  useEffect(() => {
    async function fetchData() {
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

        const queries = [
          supabase
            .from('Despesas')
            .select('*')
            .eq('user_id', user_id),
          supabase
            .from('Receitas')
            .select('*')
            .eq('user_id', user_id)
        ]

        if (selectedMonth > 0) {
          queries[0] = queries[0].eq('mes', selectedMonth)
          queries[1] = queries[1].eq('mes', selectedMonth)
        }

        const [despesasResponse, receitasResponse] = await Promise.all(queries)

        if (despesasResponse.error) {
          throw new Error(`Error fetching despesas: ${despesasResponse.error.message}`)
        }

        if (receitasResponse.error) {
          throw new Error(`Error fetching receitas: ${receitasResponse.error.message}`)
        }

         // Agregar despesas por Unidade Orçamentária
         const unidadeMap = new Map<string, ValoresAgregados>()
            despesasResponse.data.forEach((d) => {
            // Get the mapped unit or use the original if no mapping exists
            const mappedUnidade = agregadorUnidadeOrcamentaria[String(d.unidade_orcamentaria)] || d.unidade_orcamentaria
            
            const existing = unidadeMap.get(mappedUnidade) || { 
                total_orcado: 0, 
                total_saldo: 0, 
                total_empenhado: 0 
            }
            
            unidadeMap.set(mappedUnidade, {
                total_orcado: existing.total_orcado + d.orcado,
                total_saldo: existing.total_saldo + d.saldo,
                total_empenhado: existing.total_empenhado + d.empenhado
            })
        })
 
         // Agregar despesas por Fonte de Recurso
         const fonteMap = new Map<string, ValoresAgregados>()
         despesasResponse.data.forEach((d) => {
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
            despesasResponse.data.forEach((d) => {
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
            const despesasPorElemento = Array.from(elementoMap.entries()).map(([elemento_despesa, valores]) => ({
            elemento_despesa,
            valores
        }))
 
         // Agregar receitas por Descrição
         const descricaoMap = new Map<string, { total_orcado: number, total_saldo: number, total_receita: number }>()
         receitasResponse.data.forEach((r) => {
           const existing = descricaoMap.get(r.descricao) || { total_orcado: 0, total_saldo: 0, total_receita: 0 }
           descricaoMap.set(r.descricao, {
             total_orcado: existing.total_orcado + r.orcado,
             total_saldo: existing.total_saldo + r.saldo,
             total_receita: existing.total_receita + (r.receita)  // Garantindo que arrecadado existe
           })
         })
 
         const receitaFonteMap = new Map<string, { total_orcado: number, total_saldo: number, total_receita: number }>()
         receitasResponse.data.forEach((r) => {
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
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user_id, selectedMonth])

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
    <div className="p-4">
      <h1 className="text-2xl text-center font-bold mb-6">Dashboard</h1>
      
      <div className="mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="block mx-auto w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-center mb-4">Despesas por Unidade Orçamentária</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Unidade Orçamentária</th>
                <th className="px-4 py-2 text-left">Total Orçado</th>
                <th className="px-4 py-2 text-left">Total Saldo</th>
                <th className="px-4 py-2 text-left">Total Empenhado</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {despesasPorUnidade.map((item, index) => (
                <tr key={index} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 text-gray-900 dark:text-primary">{item.unidade_orcamentaria}</td>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{item.valores.total_orcado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{item.valores.total_saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{item.valores.total_empenhado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-center mb-4">Despesas por Fonte de Recurso</h2>
        <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
            <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Fonte de Recurso</th>
                <th className="px-4 py-2 text-left">Total Orçado</th>
                <th className="px-4 py-2 text-left">Total Saldo</th>
                <th className="px-4 py-2 text-left">Total Empenhado</th>
            </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
            {despesasPorFonte.map((item, index) => (
                <tr key={index} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-2 text-gray-900 dark:text-primary">{item.fonte_de_recurso}</td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                    {item.valores.total_orcado.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                    })}
                </td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                    {item.valores.total_saldo.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                    })}
                </td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                    {item.valores.total_empenhado.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                    })}
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-center mb-4">Despesas por Elemento</h2>
        <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
            <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Elemento da Despesa</th>
                <th className="px-4 py-2 text-left">Total Orçado</th>
                <th className="px-4 py-2 text-left">Total Saldo</th>
                <th className="px-4 py-2 text-left">Total Empenhado</th>
            </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
            {despesasPorElemento.map((item, index) => (
                <tr key={index} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-2 text-gray-900 dark:text-primary">{item.elemento_despesa}</td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                    {item.valores.total_orcado.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                    })}
                </td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                    {item.valores.total_saldo.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                    })}
                </td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                    {item.valores.total_empenhado.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                    })}
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
      </div>



      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Receitas por Fonte de Recurso</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-2 text-left">Fonte de Recurso</th>
                <th className="px-4 py-2 text-left">Total Orçado</th>
                <th className="px-4 py-2 text-left">Total Saldo</th>
                <th className="px-4 py-2 text-left">Total Receita</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {receitasPorFonte.map((item, index) => (
                <tr key={index} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{item.fonte_de_recurso}</td>
                  <td className="px-4 py-2">{item.total_orcado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-2">{item.total_saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-2">{item.total_receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Receitas por Descrição</h2>
        <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto"> {/* Set a fixed height and enable vertical scrolling */}
            <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-4 py-2 text-left">Descrição</th>
                    <th className="px-4 py-2 text-left">Total Orçado</th>
                    <th className="px-4 py-2 text-left">Total Saldo</th>
                    <th className="px-4 py-2 text-left">Total Receita</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                {receitasPorDescricao.map((item, index) => ( // Limit to 10 entries
                    <tr key={index} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2">{item.descricao}</td>
                    <td className="px-4 py-2">{item.total_orcado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-2">{item.total_saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-2">{item.total_receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      </div>
    </div>
  )
}

// Componente wrapper com Suspense
export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-4">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
