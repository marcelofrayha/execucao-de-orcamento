export default function ClosePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-800">
          Registro Concluído!
        </h1>
        <p className="text-gray-900 dark:text-gray-800">
          Você pode fechar esta janela com segurança.
          Por favor, verifique seu email para confirmar o cadastro.
        </p>
      </div>
    </div>
  );
} 