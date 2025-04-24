import { useState, useEffect } from 'react';

interface UseGoogleCalendarProps {
  accessToken: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  htmlLink: string;
  creator: {
    email: string;
    displayName?: string;
  };
}

export function useGoogleCalendar({ accessToken }: UseGoogleCalendarProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lista eventos do calendário dentro de um intervalo de tempo
  const listEvents = async (
    startDate: Date,
    endDate: Date,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent[]> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.result.items || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar eventos do calendário';
      setError(errorMessage);
      console.error('Erro ao buscar eventos do calendário:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Cria um novo evento no calendário
  const createEvent = async (
    event: {
      summary: string;
      location?: string;
      description?: string;
      start: {
        dateTime: Date | string;
        timeZone?: string;
      };
      end: {
        dateTime: Date | string;
        timeZone?: string;
      };
      attendees?: {
        email: string;
        displayName?: string;
      }[];
    },
    calendarId: string = 'primary'
  ): Promise<CalendarEvent | null> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Formatar datas para ISO string se forem objetos Date
      const eventResource = {
        ...event,
        start: {
          ...event.start,
          dateTime: typeof event.start.dateTime === 'object' 
            ? (event.start.dateTime as Date).toISOString() 
            : event.start.dateTime,
        },
        end: {
          ...event.end,
          dateTime: typeof event.end.dateTime === 'object' 
            ? (event.end.dateTime as Date).toISOString() 
            : event.end.dateTime,
        },
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: eventResource,
      });

      return response.result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar evento no calendário';
      setError(errorMessage);
      console.error('Erro ao criar evento no calendário:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Atualiza um evento existente
  const updateEvent = async (
    eventId: string,
    eventUpdates: {
      summary?: string;
      location?: string;
      description?: string;
      start?: {
        dateTime: Date | string;
        timeZone?: string;
      };
      end?: {
        dateTime: Date | string;
        timeZone?: string;
      };
      attendees?: {
        email: string;
        displayName?: string;
      }[];
    },
    calendarId: string = 'primary'
  ): Promise<CalendarEvent | null> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Formatar datas para ISO string se forem objetos Date
      const eventResource = {
        ...eventUpdates,
        start: eventUpdates.start ? {
          ...eventUpdates.start,
          dateTime: typeof eventUpdates.start.dateTime === 'object' 
            ? (eventUpdates.start.dateTime as Date).toISOString() 
            : eventUpdates.start.dateTime,
        } : undefined,
        end: eventUpdates.end ? {
          ...eventUpdates.end,
          dateTime: typeof eventUpdates.end.dateTime === 'object' 
            ? (eventUpdates.end.dateTime as Date).toISOString() 
            : eventUpdates.end.dateTime,
        } : undefined,
      };

      // Primeiro, obtém o evento atual para mesclar com as atualizações
      const currentEvent = await window.gapi.client.calendar.events.get({
        calendarId,
        eventId,
      });

      // Mescla o evento atual com as atualizações
      const updatedEvent = {
        ...currentEvent.result,
        ...eventResource,
      };

      const response = await window.gapi.client.calendar.events.update({
        calendarId,
        eventId,
        resource: updatedEvent,
      });

      return response.result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar evento no calendário';
      setError(errorMessage);
      console.error('Erro ao atualizar evento no calendário:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Exclui um evento do calendário
  const deleteEvent = async (
    eventId: string, 
    calendarId: string = 'primary'
  ): Promise<boolean> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await window.gapi.client.calendar.events.delete({
        calendarId,
        eventId,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir evento do calendário';
      setError(errorMessage);
      console.error('Erro ao excluir evento do calendário:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Lista os calendários do usuário
  const listCalendars = async (): Promise<{id: string, summary: string}[]> => {
    if (!accessToken) {
      setError('Token de acesso não disponível. Faça login primeiro.');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.gapi.client.calendar.calendarList.list();
      
      return (response.result.items || []).map((calendar: any) => ({
        id: calendar.id,
        summary: calendar.summary,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao listar calendários';
      setError(errorMessage);
      console.error('Erro ao listar calendários:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    listEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    listCalendars,
  };
}

export default useGoogleCalendar;