'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { agregadorUnidadeOrcamentaria, agregadorFonteRecurso, agregadorElementoDespesa, agregadorDescricaoReceita } from './agregadores'
import { calcularProjecaoEmpenho, calcularProjecaoReceita, processarDadosHistoricos, DadoHistoricoAgregado, DadoHistoricoReceitaAgregado, processarDadosHistoricosReceitas } from '@/utils/projecao';
import { TabelaProjecao } from './tabela-projecao';
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { DashboardHeader } from '@/components/ui/header'
import { Input } from '@/components/ui/input'

// Import Graph Components
import DespesasGraph from './components/DespesasGraph'
import ReceitasGraph from './components/ReceitasGraph'
import { ProjecaoExplanation } from '@/components/ProjecaoExplanation';

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

async function fetchHistoricalDespesas(supabase: any, user_id: string, selectedYear: number) {
  let allData: any[] = [];
  let hasMore = true;
  let page = 0;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('Despesas')
      .select('*')
      .eq('user_id', user_id)
      .lte('ano', selectedYear)
      .range(page * 1000, (page + 1) * 1000 - 1);
      
    if (error) {
      console.error('Error fetching historical despesas:', error);
      throw error;
    }
    
    console.log(`Fetched page ${page} of historical despesas:`, {
      records: data?.length,
      sampleData: data?.slice(0, 2)
    });
    
    allData = [...allData, ...data];
    hasMore = data.length === 1000;
    page++;
  }
  
  console.log('Total historical despesas fetched:', allData.length);
  return allData;
}

async function fetchHistoricalReceitas(supabase: any, user_id: string, selectedYear: number) {
  let allData: any[] = [];
  let hasMore = true;
  let page = 0;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('Receitas')
      .select('*')
      .eq('user_id', user_id)
      .lte('ano', selectedYear)
      .range(page * 1000, (page + 1) * 1000 - 1);
      
    if (error) {
      console.error('Error fetching historical receitas:', error);
      throw error;
    }
    
    allData = [...allData, ...data];
    hasMore = data.length === 1000;
    page++;
  }
  
  return allData;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
      >
        {isOpen ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Ocultar {title}
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Mostrar {title}
          </>
        )}
      </Button>

      {isOpen && (
        <div className="space-y-8">
          {children}
        </div>
      )}
    </div>
  )
}

interface Profile {
  user_id: string;
  nome: string;
  municipio: string;
  estado: string;
}

function DashboardContent() {
  const [despesasPorUnidade, setDespesasPorUnidade] = useState<DespesasPorUnidade[]>([])
  const [despesasPorFonte, setDespesasPorFonte] = useState<DespesasPorFonte[]>([])
  const [despesasPorElemento, setDespesasPorElemento] = useState<DespesasPorElemento[]>([])
  const [receitasPorDescricao, setReceitasPorDescricao] = useState<ReceitaPorDescricao[]>([])
  const [receitasPorFonte, setReceitasPorFonte] = useState<ReceitaPorFonte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth - 2)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [dadosHistoricos, setDadosHistoricos] = useState<DadoHistoricoAgregado[]>([])
  const [dadosHistoricosReceitas, setDadosHistoricosReceitas] = useState<DadoHistoricoReceitaAgregado[]>([])
  const [historicalDespesas, setHistoricalDespesas] = useState<any[]>([]);
  const [despesasPorUnidadeFonte, setDespesasPorUnidadeFonte] = useState<Array<{ unidade_fonte: string, valores: ValoresAgregados }>>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [despesasPorCategoriaFonte, setDespesasPorCategoriaFonte] = useState<Array<{ 
    categoria_fonte: string, 
    valores: ValoresAgregados 
  }>>([]);
  const [deduction, setDeduction] = useState<number>(0)
  const [submittedDeduction, setSubmittedDeduction] = useState<number>(0)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const user_id = searchParams.get('user_id')

  const dadosProjecao = despesasPorCategoriaFonte.map(item => {
    const [elemento_despesa, fonte_recurso] = item.categoria_fonte.split(' - ');
    return {
      elemento_despesa,
      fonte_recurso,
      valores: {
        total_empenhado: item.valores.total_empenhado,
        total_saldo: item.valores.total_saldo
      },
      analise: calcularProjecaoEmpenho(
        dadosHistoricos,
        selectedMonth,
        item.valores.total_empenhado,
        item.valores.total_saldo,
        selectedYear
      )
    };
  });

  const receitasPorFonteComProjecao = receitasPorFonte.map(item => ({
    ...item,
    analise: calcularProjecaoReceita(
      dadosHistoricosReceitas,
      selectedMonth,
      item.total_receita - (item.total_receita / 12),
      item.total_saldo - (item.total_saldo / 12),
      selectedYear
    )
  }))

  const totals = {
    unidade: despesasPorUnidade.reduce((acc, item) => ({
      total_orcado: acc.total_orcado + item.valores.total_orcado,
      total_saldo: acc.total_saldo + item.valores.total_saldo,
      total_empenhado: acc.total_empenhado + item.valores.total_empenhado
    }), { total_orcado: 0, total_saldo: 0, total_empenhado: 0 }),

    fonte: despesasPorFonte.reduce((acc, item) => ({
      total_orcado: acc.total_orcado + item.valores.total_orcado,
      total_saldo: acc.total_saldo + item.valores.total_saldo,
      total_empenhado: acc.total_empenhado + item.valores.total_empenhado
    }), { total_orcado: 0, total_saldo: 0, total_empenhado: 0 }),

    elemento: despesasPorElemento.reduce((acc, item) => ({
      total_orcado: acc.total_orcado + item.valores.total_orcado,
      total_saldo: acc.total_saldo + item.valores.total_saldo,
      total_empenhado: acc.total_empenhado + item.valores.total_empenhado
    }), { total_orcado: 0, total_saldo: 0, total_empenhado: 0 }),

    receitaFonte: receitasPorFonte.reduce((acc, item) => ({
      total_orcado: acc.total_orcado + item.total_orcado,
      total_saldo: acc.total_saldo + item.total_saldo,
      total_receita: acc.total_receita + item.total_receita
    }), { total_orcado: 0, total_saldo: 0, total_receita: 0 }),

    receitaDescricao: receitasPorDescricao.reduce((acc, item) => ({
      total_orcado: acc.total_orcado + item.total_orcado,
      total_saldo: acc.total_saldo + item.total_saldo,
      total_receita: acc.total_receita + item.total_receita
    }), { total_orcado: 0, total_saldo: 0, total_receita: 0 })
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10)
    setSelectedMonth(isNaN(value) ? 0 : value)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10)
    setSelectedYear(isNaN(value) ? currentYear : value)
  }

  const handleDeductionSubmit = () => {
    setSubmittedDeduction(deduction)
  }

  const headerRevenueTotals = {
    saldoReceita: totals.receitaFonte.total_saldo,
    receitaMes: totals.receitaFonte.total_receita,
    projecaoReceita: receitasPorFonteComProjecao.reduce(
      (acc, item) => {
        return acc + (item.analise?.projecaoFinalAnoReceita || 0);
      }, 
      0
    ) - (submittedDeduction / (receitasPorFonteComProjecao[0]?.analise?.proporcaoMediaHistorica || 1)),
    percentualReceitaProjetada: receitasPorFonteComProjecao.reduce(
      (acc, item) => acc + (item.analise?.percentualReceitaExecutado || 0), 
      0
    ) / receitasPorFonteComProjecao.length
  }

  useEffect(() => {
    async function fetchData() {
      if (!user_id) {
        setError('ID de usuário não fornecido.');
        return;
      }
      
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Buscar o usuário autenticado
        const { data: session, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session.session?.user) {
          setError('Usuário não autenticado.');
          router.push('/sign-in');
          return;
        }

        const authenticatedUserId = session.session.user.id;

        // Verificar se o user_id na URL corresponde ao usuário autenticado
        if (authenticatedUserId !== user_id) {
          setError('Usuário não autorizado para acessar este dashboard.');
          router.push('/sign-in');
          return;
        }

        // Buscar o perfil
        const { data: profileData, error: profileError } = await supabase
          .from('municipios')
          .select('*')
          .eq('user_id', user_id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError.message);
          // Redirecionar para inicialização do perfil se não existir
          router.push(`/initialize-profile?user_id=${user_id}`);
          return;
        } else {
          setProfile(profileData);
        }
        
        // Fetch historical data for the graph
        const historicalData = await fetchHistoricalDespesas(supabase, user_id, selectedYear);
        console.log('Setting historical despesas:', {
          total: historicalData.length,
          years: Array.from(new Set(historicalData.map(d => d.ano))),
          months: Array.from(new Set(historicalData.map(d => d.mes))).sort()
        });
        setHistoricalDespesas(historicalData);
        
        // Ensure selectedMonth is a valid integer
        const parsedSelectedMonth = Number(selectedMonth)
        if (isNaN(parsedSelectedMonth)) {
          setError('Invalid month selected.')
          setLoading(false)
          return
        }

        // Then use these years in the main query
        const [despesasData, despesas12Data, receitasData, receitasHistoricas] = await Promise.all([
          fetchAllDespesas(supabase, user_id, selectedMonth),
          selectedMonth !== 12 && fetchAllDespesas(supabase, user_id, 12),
          supabase
            .from('Receitas')
            .select('*')
            .eq('user_id', user_id)
            .eq('mes', Number(selectedMonth))
            .eq('ano', Number(selectedYear))
            .range(0, 999),
          fetchHistoricalReceitas(supabase, user_id, selectedYear)
        ]);

        console.log('DEBUG - Raw Receitas Data:', {
          currentMonth: receitasData.data,
          historical: receitasHistoricas
        });

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
             .sort((a, b) => b.valores.total_empenhado - a.valores.total_empenhado)
         )
         setDespesasPorUnidadeFonte(
          Array.from(unidadeMap.entries())
            .map(([unidade, valores]) => ({
              unidade_fonte: unidade,
              valores
            }))
            .sort((a, b) => b.valores.total_empenhado - a.valores.total_empenhado)
        )
         setDespesasPorFonte(Array.from(fonteMap.entries()).map(([fonte, valores]) => ({
           fonte_de_recurso: fonte,
           valores
         }))
         .sort((a, b) => b.valores.total_empenhado - a.valores.total_empenhado)
        )
         setDespesasPorElemento(Array.from(elementoMap.entries()).map(([elemento, valores]) => ({
           elemento_despesa: elemento,
           valores
         }))
         .sort((a, b) => b.valores.total_empenhado - a.valores.total_empenhado)
        )
         setReceitasPorDescricao(
           Array.from(descricaoMap.entries())
             .map(([descricao, valores]) => ({
               descricao,
               total_orcado: valores.total_orcado,
               total_saldo: valores.total_saldo,
               total_receita: valores.total_receita
             }))
             .sort((a, b) => b.total_receita - a.total_receita)
         )
         setReceitasPorFonte(
           Array.from(receitaFonteMap.entries())
             .map(([fonte, valores]) => ({
               fonte_de_recurso: fonte,
               total_orcado: valores.total_orcado,
               total_saldo: valores.total_saldo,
               total_receita: valores.total_receita
             }))
             .sort((a, b) => b.total_receita - a.total_receita)
         )

        // Process historical data
        const dadosAgregados = processarDadosHistoricos(combinedDespesas, selectedYear);
        console.log('Dados Historicos:', dadosAgregados)
        setDadosHistoricos(dadosAgregados);

        // Process historical revenue data
        const dadosHistoricosReceitasProcessados = processarDadosHistoricosReceitas(receitasHistoricas || [], selectedYear);
        console.log('DEBUG - Processed Historical Receitas:', {
          before: receitasHistoricas,
          after: dadosHistoricosReceitasProcessados
        });
        setDadosHistoricosReceitas(dadosHistoricosReceitasProcessados);

        // Agregar despesas por Unidade e Fonte de Recurso
        const unidadeFonteMap = new Map<string, ValoresAgregados>();

        despesasDisplay.forEach((d) => {
          const mappedUnidade = agregadorUnidadeOrcamentaria[String(d.unidade_orcamentaria)] || d.unidade_orcamentaria;
          const mappedFonte = agregadorFonteRecurso[String(d.fonte_de_recurso)] || d.fonte_de_recurso;

          const chave = `${mappedUnidade} - ${mappedFonte}`;

          const existing = unidadeFonteMap.get(chave) || { 
            total_orcado: 0, 
            total_saldo: 0, 
            total_empenhado: 0 
          };
          
          unidadeFonteMap.set(chave, {
            total_orcado: existing.total_orcado + (d.orcado || 0),
            total_saldo: existing.total_saldo + (d.saldo || 0),
            total_empenhado: existing.total_empenhado + (d.empenhado || 0)
          });
        });

        // Transformar o Map em um array para renderização
        setDespesasPorUnidade(
          Array.from(unidadeFonteMap.entries()).map(([chave, valores]) => ({
            unidade_orcamentaria: chave,
            valores
          }))
        );

        setDespesasPorUnidadeFonte(
          Array.from(unidadeFonteMap.entries()).map(([chave, valores]) => ({
            unidade_fonte: chave,
            valores
          }))
        );

        // Definir um array de classes de cores disponíveis
        const colorClasses = [
          'bg-white dark:bg-gray-800',
          'bg-gray-100 dark:bg-gray-700',
        ];

        // Criar um mapeamento de Unidade Orçamentária para Classe de Cor
        const unidadeToColorMap: { [unidade: string]: string } = {};

        despesasPorUnidadeFonte.forEach((item, index) => {
          const [unidade, fonte] = item.unidade_fonte.split(' - ');
          if (!unidadeToColorMap[unidade]) {
            // Alternar entre as duas cores com base no índice da unidade
            unidadeToColorMap[unidade] = colorClasses[Object.keys(unidadeToColorMap).length % colorClasses.length];
          }
        });

        // Agregar despesas por Categoria e Fonte de Recurso
        const categoriaFonteMap = new Map<string, ValoresAgregados>();

        despesasDisplay.forEach((d) => {
          const mappedCategoria = agregadorElementoDespesa[String(d.elemento_despesa)] || d.elemento_despesa;
          const mappedFonte = agregadorFonteRecurso[String(d.fonte_de_recurso)] || d.fonte_de_recurso;

          const chave = `${mappedCategoria} - ${mappedFonte}`;

          const existing = categoriaFonteMap.get(chave) || { 
            total_orcado: 0, 
            total_saldo: 0, 
            total_empenhado: 0 
          };
          
          categoriaFonteMap.set(chave, {
            total_orcado: existing.total_orcado + (d.orcado || 0),
            total_saldo: existing.total_saldo + (d.saldo || 0),
            total_empenhado: existing.total_empenhado + (d.empenhado || 0)
          });
        });

        // Transform the Map into an array for rendering
        setDespesasPorCategoriaFonte(
          Array.from(categoriaFonteMap.entries())
            .map(([chave, valores]) => ({
              categoria_fonte: chave,
              valores
            }))
            .sort((a, b) => b.valores.total_empenhado - a.valores.total_empenhado)
        );

        setLoading(false);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user_id, selectedMonth, selectedYear]);

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

   // Definir um array de classes de cores disponíveis
   const colorClasses = [
    'bg-gray-100 dark:bg-gray-900',
    'bg-white dark:bg-black',
  ];

  // Criar um mapeamento de Unidade Orçamentária para Classe de Cor
  const unidadeToColorMap: { [unidade: string]: string } = {};

  despesasPorUnidadeFonte.forEach((item, index) => {
    const [unidade, fonte] = item.unidade_fonte.split(' - ');
    if (!unidadeToColorMap[unidade]) {
      // Alternar entre as duas cores com base no índice da unidade
      unidadeToColorMap[unidade] = colorClasses[Object.keys(unidadeToColorMap).length % colorClasses.length];
    }
  });
  if (loading) {
    return <p>Carregando perfil...</p>;
  }

  if (!profile) {
    return <p>Perfil não encontrado.</p>;
  }

  return (
    <div className="flex-1 flex flex-col gap-12 px-4 py-10 max-w-5xl mx-auto">
      {/* Top Actions Row */}
      <div className="flex justify-between items-center">
        <p className="text-lg font-semibold">Dados de {profile.municipio}-{profile.estado}</p>
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

      <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg">
        <div className="flex-1">
          <label htmlFor="deduction" className="block text-sm font-medium mb-2">
            Dedução da Projeção
          </label>
          <div className="flex gap-2">
            <Input
              id="deduction"
              type="number"
              value={deduction}
              onChange={(e) => setDeduction(Number(e.target.value))}
              placeholder="Valor a deduzir da projeção"
              className="flex-1"
            />
            <Button onClick={handleDeductionSubmit}>
              Aplicar Dedução
            </Button>
          </div>
        </div>
        {submittedDeduction > 0 && (
          <div className="text-sm">
            <p className="font-medium">Dedução Aplicada:</p>
            <p className="text-muted-foreground">
              {submittedDeduction.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </p>
          </div>
        )}
      </div>

      {/* Header with statistics */}
      <DashboardHeader 
        totalSaldo={totals.unidade.total_saldo}
        totalEmpenhado={totals.unidade.total_empenhado}
        percentualExecutado={dadosProjecao.reduce((acc, item) => acc + (item.analise?.percentualExecutado || 0), 0)}
        percentualExecutadoTotal={dadosProjecao.reduce((acc, item) => acc + ((item.analise?.projecaoFinalAno || 0) / totals.unidade.total_saldo) * 100, 0)}
        projecaoFinalAno={dadosProjecao.reduce((acc, item) => acc + (item.analise?.projecaoFinalAno || 0), 0)}
        mes={months.find(m => m.value === selectedMonth)?.label || ''}
        ano={selectedYear}
        saldoReceita={headerRevenueTotals.saldoReceita}
        receitaMes={headerRevenueTotals.receitaMes}
        projecaoReceita={headerRevenueTotals.projecaoReceita}
        percentualReceitaProjetada={headerRevenueTotals.percentualReceitaProjetada}
      />

      {/* Main content sections */}
      <div className="space-y-16">
        {/* Projection Explanation */}
        <div className="bg-card rounded-lg shadow-sm">
          <ProjecaoExplanation selectedYear={selectedYear} />
        </div>

        {/* Graphical Representations */}
        <div className="space-y-16">
          {/* Despesas Graph */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-8 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
              Histórico de Despesas
            </h2>
            <DespesasGraph dadosHistoricos={historicalDespesas} />
          </div>

          {/* Receitas Graph */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-8 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
              Histórico de Receitas
            </h2>
            <ReceitasGraph dadosHistoricosReceitas={dadosHistoricosReceitas} />
          </div>
        </div>


        {/* Projection Table */}
        <div className="bg-card rounded-lg shadow-sm">
          <TabelaProjecao 
            dados={dadosProjecao} 
            selectedMonth={selectedMonth} 
          />
        </div>
        {/* Collapsible Details Sections */}
        <div className="space-y-4">
          {/* Despesas Collapsible */}
          <CollapsibleSection title="Detalhes de Despesas">
            {/* Despesas por Unidade */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Despesas por Unidade Orçamentária e Fonte de Recurso</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left p-4">Unidade Orçamentária</th>
                      <th className="text-left p-4">Fonte de Recurso</th>
                      <th className="text-right p-4">Orçado em Janeiro</th>
                      <th className="text-right p-4">Orçado em {months[selectedMonth].label}</th>
                      <th className="text-right p-4">Empenhado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesasPorUnidadeFonte
                      .filter(item => item.valores.total_saldo !== 0)
                      .map((item, index) => {
                        const [unidade, fonte] = item.unidade_fonte.split(' - ');
                        const rowColor = unidadeToColorMap[unidade] || 'bg-white'; // Classe de cor ou branco padrão

                        return (
                          <tr
                            key={index}
                            className={`border-b hover:bg-muted/50 ${rowColor}`}
                          >
                            <td className="p-4">{unidade}</td>
                            <td className="p-4">{fonte}</td>
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
                        );
                      })}
                    <tr className="border-t font-bold bg-muted/50">
                      <td className="p-4">Total</td>
                      <td className="p-4"></td>
                      <td className="text-right p-4">
                        {despesasPorUnidadeFonte.reduce((sum, item) => sum + item.valores.total_orcado, 0).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {despesasPorUnidadeFonte.reduce((sum, item) => sum + item.valores.total_saldo, 0).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {despesasPorUnidadeFonte.reduce((sum, item) => sum + item.valores.total_empenhado, 0).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                    </tr>
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
                      <th className="text-right p-4">Orçado em Janeiro</th>
                      <th className="text-right p-4">Orçado em {months[selectedMonth].label}</th>
                      <th className="text-right p-4">Empenhado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesasPorFonte
                      .filter(item => item.valores.total_saldo !== 0)
                      .map((item, index) => (
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
                    <tr className="border-t font-bold bg-muted/50">
                      <td className="p-4">Total</td>
                      <td className="text-right p-4">
                        {totals.fonte.total_orcado.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {totals.fonte.total_saldo.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {totals.fonte.total_empenhado.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                    </tr>
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
                      <th className="text-right p-4">Orçado em Janeiro</th>
                      <th className="text-right p-4">Orçado em {months[selectedMonth].label}</th>
                      <th className="text-right p-4">Empenhado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesasPorElemento
                      .filter(item => item.valores.total_saldo !== 0)
                      .map((item, index) => (
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
                    <tr className="border-t font-bold bg-muted/50">
                      <td className="p-4">Total</td>
                      <td className="text-right p-4">
                        {totals.elemento.total_orcado.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {totals.elemento.total_saldo.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {totals.elemento.total_empenhado.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleSection>

          {/* Receitas Collapsible */}
          <CollapsibleSection title="Detalhes de Receitas">
            {/* Receitas por Fonte */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Receitas por Fonte de Recurso</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Fonte de Recurso</th>
                      <th className="text-right p-4">Orçado em Janeiro</th>
                      <th className="text-right p-4">Orçado em {months[selectedMonth].label}</th>
                      <th className="text-right p-4">Receita</th>
                      <th className="text-right p-4">Projeção</th>
                      <th className="text-right p-4">Projeção %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receitasPorFonteComProjecao.map((item, index) => (
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
                        <td className="text-right p-4">
                          {item.analise?.projecaoFinalAnoReceita.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}
                        </td>
                        <td className="text-right p-4">
                          {`${(item.analise?.percentualReceitaExecutado || 0).toFixed(1)}%`}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t font-bold bg-muted/50">
                      <td className="p-4">Total</td>
                      <td className="text-right p-4">
                        {totals.receitaFonte.total_orcado.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {totals.receitaFonte.total_saldo.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {totals.receitaFonte.total_receita.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="text-right p-4">
                        {receitasPorFonteComProjecao.reduce((acc, item) => acc + (item.analise?.projecaoFinalAnoReceita || 0), 0)
                          .toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}
                      </td>
                      <td className="text-right p-4">
                        {`${(receitasPorFonteComProjecao.reduce((acc, item) => acc + (item.analise?.percentualReceitaExecutado || 0), 0) / receitasPorFonteComProjecao.length).toFixed(1)}%`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Receitas por Descrição */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Receitas por Descrição</h2>
              <div className="overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-card z-10 shadow-sm">
                      <tr className="border-b">
                        <th className="text-left p-4">Descrição</th>
                        <th className="text-right p-4">Orçado em Janeiro</th>
                        <th className="text-right p-4">Orçado em {months[selectedMonth].label}</th>
                        <th className="text-right p-4">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receitasPorDescricao.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-4">{agregadorDescricaoReceita[item.descricao] || item.descricao}</td>
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
                      <tr className="border-t font-bold bg-muted/50">
                        <td className="p-4">Total</td>
                        <td className="text-right p-4">
                          {totals.receitaDescricao.total_orcado.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0
                          })}
                        </td>
                        <td className="text-right p-4">
                          {totals.receitaDescricao.total_saldo.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0
                          })}
                        </td>
                        <td className="text-right p-4">
                          {totals.receitaDescricao.total_receita.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CollapsibleSection>
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

