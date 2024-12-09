import { ResultadoProjecao } from '@/utils/projecao';

interface TabelaProjecaoProps {
  dados: Array<{
    elemento_despesa: string;
    fonte_recurso: string;
    valores: {
      total_empenhado: number;
      total_saldo: number;
    };
    analise: ResultadoProjecao;
  }>;
  selectedMonth: number;
}

export function TabelaProjecao({ dados, selectedMonth }: TabelaProjecaoProps) {
  // Calculate totals
  const totals = {
    total_empenhado: dados.reduce((sum, item) => sum + item.valores.total_empenhado, 0),
    total_saldo: dados.reduce((sum, item) => sum + item.valores.total_saldo, 0),
    projecaoFinalAno: dados.reduce((sum, item) => sum + item.analise.projecaoFinalAno, 0),
    percentualExecutado: 0
  };

  totals.percentualExecutado = (totals.projecaoFinalAno / totals.total_saldo) * 100 || 0;


  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Análise de Execução Orçamentária - {selectedMonth ? new Date(2024, selectedMonth - 1)
          .toLocaleString('pt-BR', { month: 'long' })
          .replace(/^\w/, c => c.toUpperCase()) : ''}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="px-4 py-2 text-center">Categoria</th>
              <th className="px-4 py-2 text-center">Fonte de Recurso</th>
              <th className="px-4 py-2 text-center">Empenhado</th>
              <th className="px-4 py-2 text-center">Orçamento Atual</th>
              <th className="px-4 py-2 text-center">Projeção Orçamento</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">% Executado</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">
            {dados
              .filter(item => item.analise.projecaoFinalAno !== 0)
              .map((item, index) => (
                <tr key={index} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 text-center">{item.elemento_despesa}</td>
                  <td className="px-4 py-2 text-center">{item.fonte_recurso}</td>
                  <td className="px-4 py-2 text-center">
                    {item.valores.total_empenhado.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      minimumFractionDigits: 0
                    })}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {item.valores.total_saldo.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      minimumFractionDigits: 0
                    })}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {item.analise.projecaoFinalAno.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </td>
                  <td className={`px-4 py-2 text-center ${
                    item.analise.statusExecucao === 'adequado' ? 'text-green-600' :
                    item.analise.statusExecucao === 'acima' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {item.analise.statusExecucao.toUpperCase()}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {item.analise.percentualExecutado.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-bold">
                <td className="px-4 py-2 text-center">Total</td>
                <td className="px-4 py-2 text-center">{/* Campo vazio ou total de categorias */}</td>
                <td className="px-4 py-2 text-center">
                  {totals.total_empenhado.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0
                  })}
                </td>
                <td className="px-4 py-2 text-center">
                  {totals.total_saldo.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0
                  })}
                </td>
                <td className="px-4 py-2 text-center">
                  {totals.projecaoFinalAno.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </td>
                <td className={`px-4 py-2 text-center ${
                  totals.percentualExecutado <= 105 && totals.percentualExecutado >= 95 ? 'text-green-600' :
                  totals.percentualExecutado > 105 ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {totals.percentualExecutado <= 105 && totals.percentualExecutado >= 95 ? 'ADEQUADO' :
                   totals.percentualExecutado > 105 ? 'ACIMA' : 'ABAIXO'}
                </td>
                <td className="px-4 py-2 text-center">
                  {totals.percentualExecutado.toFixed(1)}%
                </td>
              </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}