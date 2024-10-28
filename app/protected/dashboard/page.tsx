'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

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

export default function Dashboard() {
    const [despesasPorUnidade, setDespesasPorUnidade] = useState<DespesasPorUnidade[]>([])
    const [despesasPorFonte, setDespesasPorFonte] = useState<DespesasPorFonte[]>([])
    const [despesasPorElemento, setDespesasPorElemento] = useState<DespesasPorElemento[]>([])
    const [receitasPorDescricao, setReceitasPorDescricao] = useState<ReceitaPorDescricao[]>([])
    const [receitasPorFonte, setReceitasPorFonte] = useState<ReceitaPorFonte[]>([])
   
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const user_id = searchParams.get('user_id')

  useEffect(() => {
    async function fetchData() {
      // Add error handling for missing user_id
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

        // Fetch both despesas and receitas in parallel
        const [despesasResponse, receitasResponse] = await Promise.all([
          supabase
            .from('Despesas')
            .select('*')
            .eq('user_id', user_id),
          supabase
            .from('Receitas')
            .select('*')
            .eq('user_id', user_id)
        ])

        if (despesasResponse.error) {
          throw new Error(`Error fetching despesas: ${despesasResponse.error.message}`)
        }

        if (receitasResponse.error) {
          throw new Error(`Error fetching receitas: ${receitasResponse.error.message}`)
        }

         // Agregar despesas por Unidade Orçamentária
         const unidadeMap = new Map<string, ValoresAgregados>()
         despesasResponse.data.forEach((d) => {
           const existing = unidadeMap.get(d.unidade_orcamentaria) || { total_orcado: 0, total_saldo: 0, total_empenhado: 0 }
           unidadeMap.set(d.unidade_orcamentaria, {
             total_orcado: existing.total_orcado + d.orcado,
             total_saldo: existing.total_saldo + d.saldo,
             total_empenhado: existing.total_empenhado + d.empenhado
           })
         })
 
         // Agregar despesas por Fonte de Recurso
         const fonteMap = new Map<string, ValoresAgregados>()
         despesasResponse.data.forEach((d) => {
           const existing = fonteMap.get(d.fonte_de_recurso) || { total_orcado: 0, total_saldo: 0, total_empenhado: 0 }
           fonteMap.set(d.fonte_de_recurso, {
             total_orcado: existing.total_orcado + d.orcado,
             total_saldo: existing.total_saldo + d.saldo,
             total_empenhado: existing.total_empenhado + d.empenhado
           })
         })
 
         // Agregar despesas por Elemento
         const elementoMap = new Map<string, ValoresAgregados>()
         despesasResponse.data.forEach((d) => {
           const existing = elementoMap.get(d.elemento_despesa) || { total_orcado: 0, total_saldo: 0, total_empenhado: 0 }
           elementoMap.set(d.elemento_despesa, {
             total_orcado: existing.total_orcado + d.orcado,
             total_saldo: existing.total_saldo + d.saldo,
             total_empenhado: existing.total_empenhado + d.empenhado
           })
         })
 
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
 
         // Agregar receitas por Fonte
         const receitaFonteMap = new Map<string, { total_orcado: number, total_saldo: number, total_receita: number }>()
         receitasResponse.data.forEach((r) => {
           const existing = receitaFonteMap.get(r.fonte_de_recurso) || { total_orcado: 0, total_saldo: 0, total_receita: 0 }
           receitaFonteMap.set(r.fonte_de_recurso, {
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
  }, [user_id])

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

  if (!despesasPorUnidade.length && !receitasPorDescricao.length) {
    return (
      <div className="p-4">
        <p>Nenhum dado encontrado para este usuário.</p>
        <p className="text-sm text-gray-500">User ID: {user_id}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Despesas por Unidade Orçamentária</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Unidade Orçamentária</th>
                <th className="px-4 py-2">Total Orçado</th>
                <th className="px-4 py-2">Total Saldo</th>
                <th className="px-4 py-2">Total Empenhado</th>
              </tr>
            </thead>
            <tbody>
              {despesasPorUnidade.map((item, index) => (
                <tr key={index} className="border-t border-gray-300">
                  <td className="px-4 py-2">{item.unidade_orcamentaria}</td>
                  <td className="px-4 py-2">{item.valores.total_orcado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-2">{item.valores.total_saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-2">{item.valores.total_empenhado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Receitas por Descrição</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Total Orçado</th>
                <th className="px-4 py-2">Total Saldo</th>
                <th className="px-4 py-2">Total Receita</th>
              </tr>
            </thead>
            <tbody>
              {receitasPorDescricao.map((item, index) => (
                <tr key={index} className="border-t border-gray-300">
                  <td className="px-4 py-2">{item.descricao}</td>
                  <td className="px-4 py-2">{item.total_orcado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-2">{item.total_saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-2">{item.total_receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Receitas por Fonte de Recurso</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Fonte de Recurso</th>
                <th className="px-4 py-2">Total Orçado</th>
                <th className="px-4 py-2">Total Saldo</th>
                <th className="px-4 py-2">Total Receita</th>
              </tr>
            </thead>
            <tbody>
              {receitasPorFonte.map((item, index) => (
                <tr key={index} className="border-t border-gray-300">
                  <td className="px-4 py-2">{item.fonte_de_recurso}</td>
                  <td className="px-4 py-2">{item.total_orcado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-2">{item.total_saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-2">{item.total_receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
