import { DadoHistoricoAgregado } from '@/utils/projecao';
import { agregadorElementoDespesa } from '../agregadores';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface DespesasGraphProps {
  dadosHistoricos: DadoHistoricoAgregado[];
}

const DespesasGraph: React.FC<DespesasGraphProps> = ({ dadosHistoricos }) => {
  // Get min and max dates from historical data
  const dates = dadosHistoricos?.map(d => ({
    ano: d.ano,
    mes: d.mes
  }));
  
  const minDate = dates?.reduce((min, curr) => {
    if (!min || curr.ano < min.ano || (curr.ano === min.ano && curr.mes < min.mes)) {
      return curr;
    }
    return min;
  });
  
  const maxDate = dates?.reduce((max, curr) => {
    if (!max || curr.ano > max.ano || (curr.ano === max.ano && curr.mes > max.mes)) {
      return curr;
    }
    return max;
  });

  // Generate complete range of months
  const getAllMonths = (startDate: typeof minDate, endDate: typeof maxDate) => {
    const months: string[] = [];
    if (!startDate || !endDate) return months;
    
    let currentDate = new Date(startDate.ano, startDate.mes - 1);
    const lastDate = new Date(endDate.ano, endDate.mes - 1);
    
    while (currentDate <= lastDate) {
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      months.push(`${year}-${month}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  };

  // Aggregate data
  const dataMap: { [key: string]: { [key: string]: number } } = {};

  dadosHistoricos?.forEach((dado) => {
    const categoria = agregadorElementoDespesa[dado.elemento_despesa] || 'Não Classificado';
    const { ano, mes } = dado;
    const empenhado = Number(dado.empenhado) || 0;
    
    const anoMes = `${ano}-${mes.toString().padStart(2, '0')}`;
    
    if (!dataMap[categoria]) {
      dataMap[categoria] = {};
    }
    
    if (!dataMap[categoria][anoMes]) {
      dataMap[categoria][anoMes] = 0;
    }
    dataMap[categoria][anoMes] += empenhado;
  });

  console.log('Processed despesas data:', dataMap);

  // Get unique categories and generate complete month range
  const categorias = Object.keys(dataMap)
    .filter(cat => cat !== 'Não Classificado')
    .sort((a, b) => {
      const sumA = Object.values(dataMap[a]).reduce((acc, val) => acc + val, 0);
      const sumB = Object.values(dataMap[b]).reduce((acc, val) => acc + val, 0);
      return sumB - sumA;
    });

  const meses = getAllMonths(minDate, maxDate);

  console.log('Unique months:', meses);
  console.log('Unique categorias:', categorias);

  // Create datasets with complete month range
  const datasets = categorias.map((categoria, index) => ({
    label: categoria,
    data: meses.map((mes) => dataMap[categoria][mes] || 0),
    backgroundColor: `rgba(${(index * 50) % 255}, ${(index * 80) % 255}, ${(index * 110) % 255}, 0.5)`,
  }));

  const data = {
    labels: meses,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Despesas por Categoria Econômica',
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  return (
    <div className="bg-card rounded-lg shadow-sm p-6">
      <Bar options={options} data={data} />
    </div>
  );
};

export default DespesasGraph; 