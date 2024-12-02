import { agregadorElementoDespesa } from '../app/protected/dashboard/agregadores';
import { agregadorFonteRecurso } from '../app/protected/dashboard/agregadores';
// Tipos
export interface DadoHistoricoAgregado {
  elemento_despesa: string;
  ano: number;
  mes: number;
  empenhado: number;
}

export interface DadoHistoricoReceitaAgregado {
  fonte_recurso: string;
  ano: number;
  mes: number;
  receita_mes: number;
}
  
  
  // Função principal
  export interface ResultadoProjecao {
    projecaoFinalAno: number;
    projecaoFinalAnoTotal: number;  // Added for total projection
    percentualExecutado: number;
    percentualExecutadoTotal: number;  // Added for total projection
    statusExecucao: 'adequado' | 'abaixo' | 'acima';
    statusExecucaoTotal: 'adequado' | 'abaixo' | 'acima';  // Added for total projection
  }

  // Nova interface para projeção de receitas
  export interface ResultadoProjecaoReceita {
    projecaoFinalAnoReceita: number;
    percentualReceitaExecutado: number;
    percentualReceitaExecutadoTotal: number;  // Added for total projection
    statusReceitaExecucao: 'adequado' | 'abaixo' | 'acima';
    statusReceitaExecucaoTotal: 'adequado' | 'abaixo' | 'acima';  // Added for total projection
  }

  // Constantes
  const PESOS_ANOS: { [key: number]: number } = {
    0: 0.40, // Ano anterior (maior peso)
    1: 0.25, // 2 anos atrás
    2: 0.20, // 3 anos atrás
    3: 0.10, // 4 anos atrás
    4: 0.05, // 5 anos atrás (menor peso)
  };
  


  export function calcularProjecaoEmpenho(
    dadosHistoricos: DadoHistoricoAgregado[],
    mesAtual: number,
    empenhoAtual: number,
    saldoAtual: number,
    selectedYear: number
  ): ResultadoProjecao {
    console.log('=== Starting Projection Calculation ===');
    console.log('Current Month:', mesAtual);
    console.log('Current Spending:', empenhoAtual);
    console.log('Current Balance:', saldoAtual);

    const categorias = Array.from(new Set(dadosHistoricos.map((d) => d.elemento_despesa)));
    console.log('Categories:', categorias);
    
    let somaPesos = 0;
    let somaProporcoesComPeso = 0;

    categorias.forEach((categoria) => {
      console.log('\n=== Processing Category:', categoria, '===');
      const dadosCategoria = dadosHistoricos.filter(
        (d) => d.elemento_despesa === categoria
      );
      
      const anosDisponiveis = Array.from(new Set(dadosCategoria.map(d => d.ano)))
        .filter(ano => ano < selectedYear)
        .sort((a, b) => b - a);
      console.log('Available Years:', anosDisponiveis);

      anosDisponiveis.forEach((ano, index) => {
        const peso = PESOS_ANOS[index] || 0;
        const dadosAno = dadosCategoria.filter(d => d.ano === ano);
        
        const empenhoMes = dadosAno.find(d => d.mes === mesAtual)?.empenhado || 0;
        const empenhoDezembro = dadosAno.find(d => d.mes === 12)?.empenhado || 0;

        console.log(`Year ${ano}:`);
        console.log(`- Weight: ${peso}`);
        console.log(`- Spending Month ${mesAtual}: ${empenhoMes}`);
        console.log(`- Spending December: ${empenhoDezembro}`);

        if (empenhoMes > 0 && empenhoDezembro > 0) {
          const proporcao = empenhoMes / empenhoDezembro;
          console.log(`- Proportion: ${proporcao.toFixed(4)} (${(proporcao * 100).toFixed(2)}%)`);
          somaProporcoesComPeso += proporcao * peso;
          somaPesos += peso;
        }
      });
    });

    // New total calculations
    let somaPesosTotal = 0;
    let somaProporcoesComPesoTotal = 0;

    const anosDisponiveisTotal = Array.from(new Set(dadosHistoricos.map(d => d.ano)))
      .filter(ano => ano < selectedYear)
      .sort((a, b) => b - a);

    console.log('\n=== Processing Total (All Categories) ===');
    anosDisponiveisTotal.forEach((ano, index) => {
      const peso = PESOS_ANOS[index] || 0;
      const dadosAno = dadosHistoricos.filter(d => d.ano === ano);
      
      const empenhoMesTotal = dadosAno
        .filter(d => d.mes === mesAtual)
        .reduce((sum, d) => sum + d.empenhado, 0);
          
      const empenhoDezembroTotal = dadosAno
        .filter(d => d.mes === 12)
        .reduce((sum, d) => sum + d.empenhado, 0);

      if (empenhoMesTotal > 0 && empenhoDezembroTotal > 0) {
        const proporcao = empenhoMesTotal / empenhoDezembroTotal;
        somaProporcoesComPesoTotal += proporcao * peso;
        somaPesosTotal += peso;
      }
    });

    // Calculate both projections
    const proporcaoMediaHistorica = somaPesos > 0 ? somaProporcoesComPeso / somaPesos : 0;
    const proporcaoMediaHistoricaTotal = somaPesosTotal > 0 ? somaProporcoesComPesoTotal / somaPesosTotal : 0;

    const projecaoFinalAno = proporcaoMediaHistorica > 0
      ? (empenhoAtual / proporcaoMediaHistorica)
      : 0;
    const projecaoFinalAnoTotal = proporcaoMediaHistoricaTotal > 0
      ? (empenhoAtual / proporcaoMediaHistoricaTotal)
      : 0;
    console.log('Projecao Final Ano:', projecaoFinalAno);
    console.log('Projecao Final Ano Total:', projecaoFinalAnoTotal);  
    const percentualExecutado = (projecaoFinalAno / saldoAtual) * 100;
    const percentualExecutadoTotal = (projecaoFinalAnoTotal / saldoAtual) * 100;

    let statusExecucao: 'adequado' | 'abaixo' | 'acima';
    let statusExecucaoTotal: 'adequado' | 'abaixo' | 'acima';

    if (percentualExecutado >= 95 && percentualExecutado <= 105) {
      statusExecucao = 'adequado';
    } else if (percentualExecutado < 95) {
      statusExecucao = 'abaixo';
    } else {
      statusExecucao = 'acima';
    }

    if (percentualExecutadoTotal >= 95 && percentualExecutadoTotal <= 105) {
      statusExecucaoTotal = 'adequado';
    } else if (percentualExecutadoTotal < 95) {
      statusExecucaoTotal = 'abaixo';
    } else {
      statusExecucaoTotal = 'acima';
    }

    return {
      projecaoFinalAno,
      projecaoFinalAnoTotal,
      percentualExecutado,
      percentualExecutadoTotal,
      statusExecucao,
      statusExecucaoTotal,
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
      .sort((a, b) => b - a);

    console.log('Anos disponíveis:', anosDisponiveis);
    // Process each available year
    for (const ano of anosDisponiveis) {

      const dadosAno = dados.filter((d) => Number(d.ano) === ano);
      console.log('Dados do ano:', dadosAno);
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
              elemento_despesa: categoria,
              ano,
              mes,
              empenhado: empenhadoMes,
            });
          }
        }
      }
    }

    console.log('Histórico Processado Final:', historicoProcessado);
    return historicoProcessado;
  }

  export function processarDadosHistoricosReceitas(
    dados: any[],
    selectedYear: number
  ): DadoHistoricoReceitaAgregado[] {
    const historicoProcessado: DadoHistoricoReceitaAgregado[] = [];

    // Obter anos únicos disponíveis, filtrando anos <= selectedYear
    const anosDisponiveis = Array.from(new Set(dados.map(d => Number(d.ano))))
      .filter(ano => ano <= selectedYear)
      .sort((a, b) => b - a);

    console.log('Anos disponíveis para Receitas:', anosDisponiveis);

    for (const ano of anosDisponiveis) {
      const dadosAno = dados.filter((d) => Number(d.ano) === ano);
      console.log('Dados do ano para Receitas:', dadosAno);
      if (dadosAno.length > 0) {
        // Obter fontes de recurso únicas e mapear para agregadas
        const fontesRecursoRaw = Array.from(new Set(dadosAno.map(d => d.fonte_de_recurso || 'Não Classificado')));
        const fontesRecurso = fontesRecursoRaw.map(fonte => agregadorFonteRecurso[fonte] || 'Outros');

        for (let fonte of fontesRecurso) {
          for (let mes = 1; mes <= 12; mes++) {
            const dadosMes = dadosAno
              .filter(d => (agregadorFonteRecurso[d.fonte_de_recurso] || 'Outros') === fonte && d.mes === mes);

            const receitaMes = dadosMes
              .reduce((sum, d) => sum + (d.receita || 0), 0);

            historicoProcessado.push({
              fonte_recurso: fonte,
              ano,
              mes,
              receita_mes: receitaMes,
            });
          }
        }
      }
    }

    console.log('Histórico de Receitas Processado Final:', historicoProcessado);
    return historicoProcessado;
  }

  // Nova função para calcular a projeção de receitas
  export function calcularProjecaoReceita(
    dadosReceitasHistoricos: DadoHistoricoReceitaAgregado[],
    mesAtual: number,
    receitaAtual: number,
    saldoAtual: number,
    selectedYear: number
  ): ResultadoProjecaoReceita {
    console.log('=== DEBUG: Iniciando Cálculo da Projeção de Receitas ===');
    console.log('Dados Históricos:', dadosReceitasHistoricos);
    console.log('Mês Atual:', mesAtual);
    console.log('Receita Atual:', receitaAtual);
    console.log('Saldo Atual:', saldoAtual);
    console.log('Ano Selecionado:', selectedYear);

    // Definição de pesos (ajuste conforme necessário)
    const PESOS_ANOS: number[] = [0.5, 0.3, 0.2]; // Exemplo para os 3 anos mais recentes

    // Extrair fontes de recurso únicas agregadas
    const fontesRecurso = Array.from(new Set(dadosReceitasHistoricos.map((d) => d.fonte_recurso)));
    console.log('Fontes de Recurso:', fontesRecurso);
    
    let somaProporcoesComPeso = 0;
    let somaPesos = 0;

    // Processar cada fonte de recurso individualmente
    fontesRecurso.forEach((fonte) => {
      console.log('\n=== Processando Fonte de Recurso:', fonte, '===');
      const dadosFonte = dadosReceitasHistoricos.filter(
        (d) => d.fonte_recurso === fonte
      );
      console.log('Dados da Fonte:', dadosFonte);
      
      const anosDisponiveis = Array.from(new Set(dadosFonte.map(d => d.ano)))
        .filter(ano => ano < selectedYear)
        .sort((a, b) => b - a);
      console.log('Anos Disponíveis:', anosDisponiveis);

      anosDisponiveis.forEach((ano, index) => {
        if (index >= PESOS_ANOS.length) {
          console.log(`- Não há peso definido para o ano ${ano}`);
          return;
        }

        const peso = PESOS_ANOS[index];
        const dadosAno = dadosFonte.filter(d => d.ano === ano);
        
        const receitaMes = dadosAno.find(d => d.mes === mesAtual)?.receita_mes || 0;
        const receitaDezembro = dadosAno.find(d => d.mes === 12)?.receita_mes || 0;

        console.log(`\nAno ${ano}:`);
        console.log(`- Peso: ${peso}`);
        console.log(`- Receita Mês ${mesAtual}: ${receitaMes}`);
        console.log(`- Receita Dezembro: ${receitaDezembro}`);

        if (receitaDezembro > 0) {
          const proporcao = receitaMes / receitaDezembro;
          console.log(`- Proporção: ${(proporcao * 100).toFixed(2)}%`);
          somaProporcoesComPeso += proporcao * peso;
          somaPesos += peso;
          console.log(`- Soma Proporções Com Peso Atual: ${somaProporcoesComPeso}`);
          console.log(`- Soma Pesos Atual: ${somaPesos}`);
        } else {
          console.log('- Ignorando ano por receita de dezembro insuficiente');
        }
      });
    });

    // Calcular média ponderada das proporções
    const proporcaoMediaHistorica = somaPesos > 0 ? somaProporcoesComPeso / somaPesos : 0;

    // Projetar receita final do ano com base na média histórica ponderada
    const projecaoFinalAnoReceita = proporcaoMediaHistorica > 0
      ? receitaAtual / proporcaoMediaHistorica
      : 0;
    console.log('Projecao Final Ano Receita:', projecaoFinalAnoReceita);

    // Calcular projeção total (opcional, se necessário)
    const projecaoFinalAnoTotalReceita = proporcaoMediaHistorica > 0
      ? receitaAtual / proporcaoMediaHistorica
      : 0;
    console.log('Projecao Final Ano Total Receita:', projecaoFinalAnoTotalReceita);  

    const percentualReceitaExecutado = saldoAtual > 0
      ? (projecaoFinalAnoReceita / saldoAtual) * 100
      : 0;
    const percentualReceitaExecutadoTotal = saldoAtual > 0
      ? (projecaoFinalAnoTotalReceita / saldoAtual) * 100
      : 0;

    let statusReceitaExecucao: 'adequado' | 'abaixo' | 'acima';
    let statusReceitaExecucaoTotal: 'adequado' | 'abaixo' | 'acima';

    if (percentualReceitaExecutado >= 95 && percentualReceitaExecutado <= 105) {
      statusReceitaExecucao = 'adequado';
    } else if (percentualReceitaExecutado < 95) {
      statusReceitaExecucao = 'abaixo';
    } else {
      statusReceitaExecucao = 'acima';
    }

    if (percentualReceitaExecutadoTotal >= 95 && percentualReceitaExecutadoTotal <= 105) {
      statusReceitaExecucaoTotal = 'adequado';
    } else if (percentualReceitaExecutadoTotal < 95) {
      statusReceitaExecucaoTotal = 'abaixo';
    } else {
      statusReceitaExecucaoTotal = 'acima';
    }

    return {
      projecaoFinalAnoReceita,
      percentualReceitaExecutado,
      percentualReceitaExecutadoTotal,
      statusReceitaExecucao,
      statusReceitaExecucaoTotal,
    };
  }

  // Exemplo de função que utiliza processarDadosHistoricosReceitas
  export function realizarProjecaoCompleta(
    dadosDespesas: any[],
    dadosReceitas: any[],
    mesAtual: number,
    empenhoAtual: number,
    receitaAtual: number,
    saldoAtual: number,
    selectedYear: number
  ): { 
    resultadoEmpenho: ResultadoProjecao; 
    resultadoReceita: ResultadoProjecaoReceita; 
    historicoReceitas: DadoHistoricoReceitaAgregado[] 
  } {
    
    // Processar dados históricos de despesas
    const historicoDespesas = processarDadosHistoricos(dadosDespesas, selectedYear);

    // Processar dados históricos de receitas com agregação
    const historicoReceitas = processarDadosHistoricosReceitas(dadosReceitas, selectedYear);

    // Calcular projeção de empenho
    const resultadoEmpenho = calcularProjecaoEmpenho(
      historicoDespesas,
      mesAtual,
      empenhoAtual,
      saldoAtual,
      selectedYear
    );

    // Calcular projeção de receita utilizando fontes agregadas
    const resultadoReceita = calcularProjecaoReceita(
      historicoReceitas,
      mesAtual,
      receitaAtual,
      saldoAtual,
      selectedYear
    );

    return {
      resultadoEmpenho,
      resultadoReceita,
      historicoReceitas,
    };
  }