import { ReactNode } from 'react';

interface FuturisticCardProps {
  title: string;
  children: ReactNode;
}

export function FuturisticCard({ title, children }: FuturisticCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
      {/* Gradiente decorativo no topo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-primary to-green-500" />
      
      {/* Cabeçalho */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>

      {/* Conteúdo */}
      <div className="p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        {children}
      </div>

      {/* Efeito de brilho */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent via-primary/10 to-transparent" />
      </div>
    </div>
  );
}