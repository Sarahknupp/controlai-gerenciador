import React, { useState } from 'react';
import { useGoogleAuth, initGoogleApi, GOOGLE_API_SCOPES } from '../lib/googleAuth';
import useGoogleDrive from '../hooks/useGoogleDrive';
import useGoogleCalendar from '../hooks/useGoogleCalendar';
import { FileUp, Calendar, Upload } from 'lucide-react';

// Defina aqui suas credenciais do Google API (substitua com suas credenciais reais)
const GOOGLE_CLIENT_ID = 'SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; // Substitua com seu ID real
const GOOGLE_API_KEY = 'SUA_API_KEY_DO_GOOGLE'; // Substitua com sua chave real

const GoogleIntegrationExample: React.FC = () => {
  const [isApiInitialized, setIsApiInitialized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  // Inicializar a API do Google
  React.useEffect(() => {
    const initApi = async () => {
      try {
        await initGoogleApi({
          clientId: GOOGLE_CLIENT_ID,
          apiKey: GOOGLE_API_KEY,
          scopes: [
            GOOGLE_API_SCOPES.signIn,
            GOOGLE_API_SCOPES.calendar,
            GOOGLE_API_SCOPES.drive
          ],
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          ],
        });
        setIsApiInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar API do Google:', error);
      }
    };

    initApi();
  }, []);

  // Hook de autenticação do Google
  const { isSignedIn, user, signIn, signOut } = useGoogleAuth();

  // Hook do Google Drive (apenas disponível quando logado)
  const { uploadFile, listFiles, error: driveError } = useGoogleDrive({ 
    accessToken: user?.accessToken || '' 
  });

  // Hook do Google Calendar (apenas disponível quando logado)
  const { listEvents, createEvent, error: calendarError } = useGoogleCalendar({ 
    accessToken: user?.accessToken || '' 
  });

  // Buscar eventos do calendário
  const handleFetchEvents = async () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    const result = await listEvents(today, nextMonth);
    setEvents(result);
  };

  // Manipular upload de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadFile(selectedFile, undefined, (progress) => {
        setUploadProgress(progress);
      });
      alert('Arquivo enviado com sucesso!');
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
    }
  };

  // Manipular criação de evento
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { summary, description, startDate, startTime, endDate, endTime } = newEvent;
    
    const eventData = {
      summary,
      description,
      start: {
        dateTime: new Date(`${startDate}T${startTime}`),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(`${endDate}T${endTime}`),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    try {
      await createEvent(eventData);
      alert('Evento criado com sucesso!');
      setNewEvent({
        summary: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
      });
      handleFetchEvents(); // Atualiza a lista de eventos
    } catch (error) {
      console.error('Erro ao criar evento:', error);
    }
  };

  if (!isApiInitialized) {
    return (
      <div className="p-6 card animate-pulse">
        <p className="text-gray-500">Inicializando API do Google...</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">Integração com Google</h2>
      
      {!isSignedIn ? (
        <div className="text-center py-6">
          <p className="mb-4">Faça login para acessar integração com Google Drive e Google Agenda</p>
          <button 
            onClick={signIn}
            className="btn-primary"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="h-5 w-5 mr-2" 
            />
            Entrar com Google
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User info */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <img 
              src={user?.imageUrl} 
              alt={user?.name} 
              className="h-10 w-10 rounded-full mr-4"
            />
            <div className="flex-1">
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button 
              onClick={signOut}
              className="btn-outline text-sm"
            >
              Sair
            </button>
          </div>

          {/* Tabs for different APIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drive Upload Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-4">
                <FileUp className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-lg">Google Drive</h3>
              </div>
              
              {driveError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                  Erro: {driveError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selecionar Arquivo
                  </label>
                  <input
                    type="file"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                    onChange={handleFileChange}
                  />
                </div>
                
                {selectedFile && (
                  <div>
                    <p className="text-sm text-gray-600">Arquivo selecionado: {selectedFile.name}</p>
                    {uploadProgress > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                    <button 
                      className="btn-primary mt-4 w-full"
                      onClick={handleUpload}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar para o Drive
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Calendar Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Calendar className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium text-lg">Google Agenda</h3>
              </div>
              
              {calendarError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                  Erro: {calendarError}
                </div>
              )}
              
              <div>
                <form onSubmit={handleCreateEvent} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título do Evento
                    </label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Reunião com cliente"
                      value={newEvent.summary}
                      onChange={(e) => setNewEvent({...newEvent, summary: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea 
                      className="input" 
                      placeholder="Detalhes do evento"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Início
                      </label>
                      <input 
                        type="date" 
                        className="input" 
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora Início
                      </label>
                      <input 
                        type="time" 
                        className="input" 
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Término
                      </label>
                      <input 
                        type="date" 
                        className="input" 
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora Término
                      </label>
                      <input 
                        type="time" 
                        className="input" 
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <button type="submit" className="btn-primary w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Criar Evento
                  </button>
                </form>
                
                <div className="mt-4">
                  <button 
                    className="btn-outline w-full"
                    onClick={handleFetchEvents}
                  >
                    Ver Próximos Eventos
                  </button>
                  
                  {events.length > 0 && (
                    <div className="mt-4 max-h-60 overflow-y-auto">
                      <h4 className="font-medium text-sm mb-2">Próximos Eventos:</h4>
                      <div className="space-y-2">
                        {events.map(event => (
                          <div key={event.id} className="p-2 bg-gray-50 rounded border text-sm">
                            <div className="font-medium">{event.summary}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(event.start.dateTime).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleIntegrationExample;