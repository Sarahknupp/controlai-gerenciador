import { useState, useEffect } from 'react';

interface UseGoogleDriveProps {
  accessToken: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink: string;
  webViewLink: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
}

interface GoogleDriveFolder {
  id: string;
  name: string;
}

export function useGoogleDrive({ accessToken }: UseGoogleDriveProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lista arquivos em uma pasta do Google Drive
  const listFiles = async (folderId?: string): Promise<GoogleDriveFile[]> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = "trashed = false";
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      } else {
        query += " and 'root' in parents";
      }

      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, iconLink, webViewLink, size, createdTime, modifiedTime)',
        orderBy: 'folder,name',
      });

      return response.result.files || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao listar arquivos no Drive';
      setError(errorMessage);
      console.error('Erro ao listar arquivos do Drive:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Cria uma pasta no Google Drive
  const createFolder = async (folderName: string, parentFolderId?: string): Promise<GoogleDriveFolder | null> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentFolderId) {
        fileMetadata['parents'] = [parentFolderId];
      }

      const response = await window.gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name',
      });

      return {
        id: response.result.id,
        name: response.result.name,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar pasta no Drive';
      setError(errorMessage);
      console.error('Erro ao criar pasta no Drive:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload de arquivo para o Google Drive
  const uploadFile = async (
    file: File, 
    folderId?: string,
    onProgress?: (progress: number) => void
  ): Promise<GoogleDriveFile | null> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const metadata = {
        name: file.name,
        mimeType: file.type,
      };

      if (folderId) {
        metadata['parents'] = [folderId];
      }

      // Cria um upload resumável
      const initResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': file.type,
          'X-Upload-Content-Length': file.size.toString(),
        },
        body: JSON.stringify(metadata),
      });

      if (!initResponse.ok) {
        throw new Error(`Falha ao iniciar upload: ${initResponse.status} ${initResponse.statusText}`);
      }

      const uploadUrl = initResponse.headers.get('Location');
      if (!uploadUrl) {
        throw new Error('URL de upload não retornada pelo Google Drive');
      }

      // Faz o upload do arquivo
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

      // Configurar o progresso do upload se o callback for fornecido
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };
      }

      // Retorna uma promessa para o resultado do upload
      return new Promise((resolve, reject) => {
        xhr.onload = async () => {
          if (xhr.status === 200 || xhr.status === 201) {
            // Buscar mais detalhes do arquivo
            const fileId = JSON.parse(xhr.responseText).id;
            const fileDetails = await window.gapi.client.drive.files.get({
              fileId,
              fields: 'id, name, mimeType, iconLink, webViewLink, size, createdTime, modifiedTime',
            });
            
            resolve(fileDetails.result);
          } else {
            reject(new Error(`Upload falhou com status: ${xhr.status}`));
          }
          setIsLoading(false);
        };

        xhr.onerror = () => {
          setError('Erro na conexão durante o upload');
          setIsLoading(false);
          reject(new Error('Erro de rede durante o upload'));
        };

        xhr.send(file);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload para o Drive';
      setError(errorMessage);
      console.error('Erro ao fazer upload para o Drive:', err);
      setIsLoading(false);
      return null;
    }
  };

  // Baixa um arquivo do Google Drive
  const downloadFile = async (fileId: string): Promise<Blob | null> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Primeiro, verifica se é um arquivo Google nativo (Docs, Sheets, etc.)
      const fileResponse = await window.gapi.client.drive.files.get({
        fileId,
        fields: 'id, name, mimeType',
      });

      const file = fileResponse.result;
      
      // Para arquivos nativos do Google, exportamos em um formato padrão
      if (file.mimeType.includes('application/vnd.google-apps')) {
        const exportMimeType = getExportMimeType(file.mimeType);
        
        if (exportMimeType) {
          const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          
          if (!response.ok) {
            throw new Error(`Falha ao exportar arquivo: ${response.status} ${response.statusText}`);
          }
          
          return await response.blob();
        } else {
          throw new Error('Tipo de arquivo Google não suportado para download');
        }
      } 
      // Para arquivos regulares, baixamos diretamente
      else {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (!response.ok) {
          throw new Error(`Falha ao baixar arquivo: ${response.status} ${response.statusText}`);
        }
        
        return await response.blob();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao baixar arquivo do Drive';
      setError(errorMessage);
      console.error('Erro ao baixar arquivo do Drive:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para determinar o tipo MIME para exportação de arquivos nativos do Google
  const getExportMimeType = (googleMimeType: string): string | null => {
    const mimeTypeMap: Record<string, string> = {
      'application/vnd.google-apps.document': 'application/pdf',
      'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.presentation': 'application/pdf',
      'application/vnd.google-apps.drawing': 'application/pdf',
    };
    
    return mimeTypeMap[googleMimeType] || null;
  };

  return {
    isLoading,
    error,
    listFiles,
    createFolder,
    uploadFile,
    downloadFile,
  };
}

export default useGoogleDrive;