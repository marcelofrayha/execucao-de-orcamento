import { agregadorElementoDespesa } from '../app/protected/dashboard/agregadores';
// Tipos
export interface DadoHistoricoAgregado {
  categoria_economica: string;
  ano: number;
  mes: number;
  empenhado_mes: number;
}
  
  export interface ResultadoProjecao {
    projecaoFinalAno: number;
    percentualExecutado: number;
    statusExecucao: 'adequado' | 'abaixo' | 'acima';
  }
  
  // Constantes
  const PESOS_ANOS: { [key: number]: number } = {
    0: 0.40, // Ano anterior (maior peso)
    1: 0.25, // 2 anos atrás
    2: 0.20, // 3 anos atrás
    3: 0.10, // 4 anos atrás
    4: 0.05, // 5 anos atrás (menor peso)
  };
  

  
  // Função principal
  export function calcularProjecaoEmpenho(
    dadosHistoricos: DadoHistoricoAgregado[],
    mesAtual: number,
    empenhoAtual: number,
    saldoAtual: number,
    selectedYear: number
  ): ResultadoProjecao {

    const categorias = Array.from(new Set(dadosHistoricos.map((d) => d.categoria_economica)));
    
    let somaPesos = 0;
    let somaProporcoesComPeso = 0;

    categorias.forEach((categoria) => {
      const dadosCategoria = dadosHistoricos.filter(
        (d) => d.categoria_economica === categoria
      );
      
      // Get available years before the selected year
      const anosDisponiveis = Array.from(new Set(dadosCategoria.map(d => d.ano)))
        .filter(ano => ano <= selectedYear)
        .sort((a, b) => b - a); // Sort descending
      
      // Process each available year
      anosDisponiveis.forEach((ano, index) => {
        const peso = PESOS_ANOS[index] || 0;
        const dadosAno = dadosCategoria.filter((d) => Number(d.ano) === ano);
        
        const empenhoMes = dadosAno
          .find(d => d.mes === mesAtual)?.empenhado_mes || 0;
        // Pegar empenho de dezembro
        const empenhoDezembro = dadosAno
          .find(d => d.mes === 12)?.empenhado_mes || 0;

        if (empenhoMes > 0 && empenhoDezembro > 0) {
          const proporcao = empenhoMes / empenhoDezembro;
          somaProporcoesComPeso += proporcao * peso;
          somaPesos += peso;
        }
      });
    });

    const proporcaoMediaHistorica = somaPesos > 0 ? somaProporcoesComPeso / somaPesos : 0;

    const projecaoFinalAno = proporcaoMediaHistorica > 0
      ? (empenhoAtual / proporcaoMediaHistorica)
      : 0;
    const percentualExecutado = projecaoFinalAno > 0 
      ? (projecaoFinalAno / saldoAtual) * 100
      : null;


    let statusExecucao: 'adequado' | 'abaixo' | 'acima';
    const percentual = percentualExecutado ?? 0;
    if (percentual >= 95 && percentual <= 105) {
      statusExecucao = 'adequado';
    } else if (percentual < 95) {
      statusExecucao = 'abaixo';
    } else {
      statusExecucao = 'acima';
    }

    return {
      projecaoFinalAno,
      percentualExecutado: percentual,
      statusExecucao,
    };
  }
  
  // Função para processar dados históricos
  export function processarDadosHistoricos(
    dados: any[],
    selectedYear: number
  ): DadoHistoricoAgregado[] {
    const historicoProcessado: DadoHistoricoAgregado[] = [];
    
    // Get unique years from the data, filtering out years >= selectedYear
    const anosDisponiveis = Array.from(new Set(dados.map(d => Number(d.ano))))
      .filter(ano => ano <= selectedYear)
      .sort((a, b) => b - a); // Sort descending

    
    // Process each available year
    for (const ano of anosDisponiveis) {

      const dadosAno = dados.filter((d) => Number(d.ano) === ano);

      if (dadosAno.length > 0) {
        // Mapear todos os dados para suas categorias
        const dadosComCategoria = dadosAno.map((d) => ({
          ...d,
          categoria_economica: agregadorElementoDespesa[d.elemento_despesa] || 'Outros'
        }));
        
        const categorias = Array.from(new Set(dadosComCategoria.map(d => d.categoria_economica)));

        for (let categoria of categorias) {
          for (let mes = 1; mes <= 12; mes++) {
            const dadosMes = dadosComCategoria
              .filter(d => d.categoria_economica === categoria && d.mes === mes);
            
            
            const empenhadoMes = dadosMes
              .reduce((sum, d) => sum + (d.empenhado || 0), 0);

            historicoProcessado.push({
              categoria_economica: categoria,
              ano,
              mes,
              empenhado_mes: empenhadoMes,
            });
          }
        }
      }
    }

    console.log('Histórico Processado Final:', historicoProcessado);
    return historicoProcessado;
  }