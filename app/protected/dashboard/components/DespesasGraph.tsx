import { DadoHistoricoAgregado } from '@/utils/projecao';
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
  // Aggregate data
  const dataMap: { [key: string]: { [key: string]: number } } = {};

  dadosHistoricos.forEach((dado) => {
    const { ano, mes, categoria_economica, empenhado_mes } = dado;
    const anoMes = `${ano}-${mes.toString().padStart(2, '0')}`;
    if (!dataMap[categoria_economica]) {
      dataMap[categoria_economica] = {};
    }
    if (!dataMap[categoria_economica][anoMes]) {
      dataMap[categoria_economica][anoMes] = 0;
    }
    dataMap[categoria_economica][anoMes] += empenhado_mes;
  });

  const categorias = Object.keys(dataMap);
  const meses = Array.from(
    new Set(dadosHistoricos.map((d) => `${d.ano}-${d.mes.toString().padStart(2, '0')}`))
  ).sort();

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