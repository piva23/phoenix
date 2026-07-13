/**
 * Utilitário de Nuvem e Backup Manual para o Phoenix OS v3.0
 */

export function exportData() {
  try {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('phoenix-')) {
        data[key] = localStorage.getItem(key);
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `phoenix-backup-v3.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    // Cleanup
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    throw error;
  }
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Nenhum arquivo fornecido."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Formato de backup inválido.');
        }

        const keys = Object.keys(parsed);
        const validKeys = keys.filter(k => k.startsWith('phoenix-'));
        
        if (validKeys.length === 0) {
          throw new Error('Nenhum dado do Phoenix OS encontrado no arquivo de backup.');
        }

        // Limpa as chaves atuais do Phoenix no localStorage antes de aplicar o backup
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('phoenix-')) {
            localStorage.removeItem(key);
          }
        }

        // Insere os dados importados
        validKeys.forEach(key => {
          localStorage.setItem(key, parsed[key]);
        });

        resolve(true);
        
        // Força o reload da página para o Zustand recarregar os estados do localStorage
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } catch (err) {
        console.error("Erro na importação:", err);
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de backup.'));
    reader.readAsText(file);
  });
}
