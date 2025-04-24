import React, { useState } from 'react';
import { 
  Calendar, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Users, 
  Clock
} from 'lucide-react';
import { ProductionSchedule, ProductionCalendarEvent } from '../../types/production';

interface ProductionCalendarProps {
  schedules: ProductionSchedule[];
  onAddSchedule: () => void;
  onEditSchedule: (scheduleId: string) => void;
  onViewScheduleDetails: (scheduleId: string) => void;
}

const ProductionCalendar: React.FC<ProductionCalendarProps> = ({
  schedules,
  onAddSchedule,
  onEditSchedule,
  onViewScheduleDetails
}) => {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [resourceView, setResourceView] = useState<boolean>(true);
  
  // Mocked resource data
  const resources = [
    { id: 'team1', title: 'Equipe 1' },
    { id: 'team2', title: 'Equipe 2' },
    { id: 'equipment1', title: 'Forno 1' },
    { id: 'equipment2', title: 'Forno 2' }
  ];

  // Convert schedules to calendar events
  const calendarEvents: ProductionCalendarEvent[] = schedules.map(schedule => {
    // Determine color based on priority
    let color = '#3B82F6'; // default blue
    switch(schedule.priority) {
      case 'high':
        color = '#EF4444'; // red
        break;
      case 'urgent':
        color = '#7C3AED'; // purple
        break;
      case 'low':
        color = '#10B981'; // green
        break;
    }
    
    // Create event
    const start = new Date(schedule.scheduledDate);
    start.setHours(parseInt(schedule.startTime.split(':')[0], 10), parseInt(schedule.startTime.split(':')[1], 10));
    
    const end = new Date(schedule.scheduledDate);
    end.setHours(parseInt(schedule.endTime.split(':')[0], 10), parseInt(schedule.endTime.split(':')[1], 10));
    
    return {
      id: schedule.id,
      title: `${schedule.recipeName} (${schedule.quantity} ${schedule.unit})`,
      start,
      end,
      resourceId: schedule.assignedTo,
      color,
      status: schedule.status,
      editable: schedule.status !== 'completed' && schedule.status !== 'cancelled'
    };
  });

  // Generate current month's days
  const getDaysInMonth = () => {
    const date = new Date(currentDate);
    date.setDate(1); // Go to first day of month
    
    const days = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1).getDay();
    
    // Add dates from previous month to fill the first week
    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPreviousMonth - i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add all days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Add dates from next month to complete the last week
    const lastDayOfMonth = new Date(year, month, daysInMonth).getDay();
    for (let i = 1; i <= 6 - lastDayOfMonth; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthsOfYear = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get time slots for day and week views (7AM to 8PM)
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 20; hour++) {
      slots.push(`${hour}:00`);
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  // Get formatted date range for header
  const getFormattedDateRange = () => {
    if (currentView === 'day') {
      return currentDate.toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const start = startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      const end = endOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
      
      return `${start} - ${end}`;
    } else {
      return `${monthsOfYear[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  // Render different calendar views
  const renderDayView = () => {
    return (
      <div className="mt-4">
        <div className="flex flex-col h-96 overflow-y-auto border rounded-lg">
          <div className="sticky top-0 z-10 flex-none bg-white shadow">
            <div className="grid">
              <div className="col-start-1 col-end-2 bg-primary text-white px-4 py-2 flex items-center justify-center">
                Hora
              </div>
              <div className="col-start-2 col-end-3 bg-primary text-white px-4 py-2 flex items-center justify-center">
                Atividades
              </div>
            </div>
          </div>
          <div className="flex flex-auto">
            <div className="flex flex-col flex-auto">
              <div className="grid grid-cols-1 grid-rows-[auto_1fr] h-full">
                <div className="grid grid-cols-2">
                  {/* Time slots */}
                  <div className="col-start-1 col-end-2 border-r border-gray-200">
                    <div className="grid grid-rows-1">
                      {timeSlots.map((time, index) => (
                        <div key={index} className="row-start-1 row-end-2 border-b border-gray-200 p-2 text-xs text-gray-500">
                          {time}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="col-start-2 col-end-3">
                    <div className="grid grid-rows-1 h-full">
                      {timeSlots.map((time, index) => (
                        <div key={index} className="row-start-1 row-end-2 border-b border-gray-200 p-2">
                          {/* Event placeholders */}
                          <div className="h-full">
                            {getEventsForDate(currentDate)
                              .filter(event => {
                                const eventHour = event.start.getHours();
                                return eventHour === parseInt(time.split(':')[0], 10);
                              })
                              .map(event => (
                                <div
                                  key={event.id}
                                  className="mb-1 p-1.5 rounded-lg text-white text-xs"
                                  style={{ backgroundColor: event.color }}
                                  onClick={() => onViewScheduleDetails(event.id)}
                                >
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-white/80 text-xs">
                                    {`${event.start.getHours().toString().padStart(2, '0')}:${event.start.getMinutes().toString().padStart(2, '0')}`} - 
                                    {`${event.end.getHours().toString().padStart(2, '0')}:${event.end.getMinutes().toString().padStart(2, '0')}`}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    // Get start and end of week
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="mt-4">
        <div className="flex flex-col h-96 overflow-y-auto border rounded-lg">
          <div className="sticky top-0 z-10 flex-none bg-white shadow">
            <div className={`grid grid-cols-[auto_repeat(${resourceView ? resources.length : weekDays.length},1fr)]`}>
              <div className="col-start-1 col-end-2 bg-primary text-white px-4 py-2 flex items-center justify-center">
                Hora
              </div>
              
              {/* Days or resources headers */}
              {resourceView ? (
                resources.map(resource => (
                  <div key={resource.id} className="bg-primary text-white px-4 py-2 flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-medium">{resource.title}</div>
                    </div>
                  </div>
                ))
              ) : (
                weekDays.map((day, index) => (
                  <div key={index} className="bg-primary text-white px-4 py-2 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm">{daysOfWeek[day.getDay()]}</div>
                      <div className="font-medium">{day.getDate()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex flex-auto">
            <div className="flex flex-col flex-auto">
              <div className={`grid grid-cols-[auto_repeat(${resourceView ? resources.length : weekDays.length},1fr)] grid-rows-[auto_1fr] h-full`}>
                {/* Time slots */}
                <div className="col-start-1 col-end-2 row-start-1 row-end-3 border-r border-gray-200">
                  <div className="grid grid-rows-1">
                    {timeSlots.map((time, index) => (
                      <div key={index} className="row-start-1 row-end-2 border-b border-gray-200 p-2 text-xs text-gray-500">
                        {time}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events grid */}
                {resourceView ? (
                  resources.map((resource, resourceIndex) => (
                    <div 
                      key={resource.id} 
                      className={`col-start-${resourceIndex + 2} col-end-${resourceIndex + 3} row-start-1 row-end-3 border-r border-gray-200`}
                    >
                      <div className="grid grid-rows-1">
                        {timeSlots.map((time, timeIndex) => (
                          <div key={`${resource.id}-${timeIndex}`} className="row-start-1 row-end-2 border-b border-gray-200 p-1">
                            {/* Events for this resource and time */}
                            {calendarEvents
                              .filter(event => 
                                event.resourceId === resource.id && 
                                event.start.getHours() === parseInt(time.split(':')[0], 10)
                              )
                              .map(event => (
                                <div
                                  key={event.id}
                                  className="mb-1 p-1.5 rounded-lg text-white text-xs cursor-pointer"
                                  style={{ backgroundColor: event.color }}
                                  onClick={() => onViewScheduleDetails(event.id)}
                                >
                                  {event.title}
                                </div>
                              ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  weekDays.map((day, dayIndex) => (
                    <div 
                      key={dayIndex} 
                      className={`col-start-${dayIndex + 2} col-end-${dayIndex + 3} row-start-1 row-end-3 border-r border-gray-200`}
                    >
                      <div className="grid grid-rows-1">
                        {timeSlots.map((time, timeIndex) => (
                          <div key={`${dayIndex}-${timeIndex}`} className="row-start-1 row-end-2 border-b border-gray-200 p-1">
                            {/* Events for this day and time slot */}
                            {calendarEvents
                              .filter(event => {
                                const eventDate = new Date(event.start);
                                return (
                                  eventDate.getDate() === day.getDate() && 
                                  eventDate.getMonth() === day.getMonth() && 
                                  eventDate.getFullYear() === day.getFullYear() && 
                                  eventDate.getHours() === parseInt(time.split(':')[0], 10)
                                );
                              })
                              .map(event => (
                                <div
                                  key={event.id}
                                  className="mb-1 p-1.5 rounded-lg text-white text-xs cursor-pointer"
                                  style={{ backgroundColor: event.color }}
                                  onClick={() => onViewScheduleDetails(event.id)}
                                >
                                  {event.title}
                                </div>
                              ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth();
    
    return (
      <div className="mt-4">
        <div className="bg-white rounded-lg border">
          <div className="grid grid-cols-7 gap-px">
            {/* Days of week header */}
            {daysOfWeek.map(day => (
              <div key={day} className="py-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((dayData, index) => {
              const { date, isCurrentMonth } = dayData;
              const isToday = date.toDateString() === new Date().toDateString();
              const events = getEventsForDate(date);
              
              return (
                <div 
                  key={index} 
                  className={`${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-100 text-gray-400'
                  } ${
                    isToday ? 'border border-primary' : ''
                  } min-h-24 p-2 relative`}
                >
                  <div className="text-right">
                    <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  
                  {/* Events for this day */}
                  <div className="mt-1 max-h-16 overflow-y-auto">
                    {events.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className="mb-1 p-1.5 rounded-lg text-white text-xs cursor-pointer truncate"
                        style={{ backgroundColor: event.color }}
                        onClick={() => onViewScheduleDetails(event.id)}
                      >
                        {event.title}
                      </div>
                    ))}
                    
                    {events.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{events.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Calendar header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold text-gray-900">Agendamento de Produção</h1>
        </div>
        
        <button 
          className="btn-primary"
          onClick={onAddSchedule}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </button>
      </div>

      {/* Calendar toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap justify-between items-center gap-3">
        <div className="flex space-x-2">
          <button onClick={goToPrevious} className="btn-outline py-1.5 px-3">
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <button onClick={goToToday} className="btn-outline py-1.5 px-3">
            Hoje
          </button>
          
          <button onClick={goToNext} className="btn-outline py-1.5 px-3">
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <div className="font-medium text-lg ml-2 flex items-center">
            {getFormattedDateRange()}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                currentView === 'day' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setCurrentView('day')}
            >
              Dia
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                currentView === 'week' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setCurrentView('week')}
            >
              Semana
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                currentView === 'month' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setCurrentView('month')}
            >
              Mês
            </button>
          </div>
          
          {currentView === 'week' && (
            <button
              className="btn-outline py-1.5 px-3 text-sm"
              onClick={() => setResourceView(!resourceView)}
            >
              {resourceView ? (
                <>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Visão por Dia
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-1" />
                  Visão por Recurso
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Calendar legend */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-6">
          <span className="text-sm font-medium text-gray-700">Legenda:</span>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm text-gray-700">Alta Prioridade</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
            <span className="text-sm text-gray-700">Urgente</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm text-gray-700">Normal</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-700">Baixa Prioridade</span>
          </div>
        </div>
      </div>

      {/* Calendar view */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        {currentView === 'day' && renderDayView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'month' && renderMonthView()}
      </div>

      {/* Conflict warnings */}
      {currentView !== 'month' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Conflitos de Agenda</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Forno 1</strong>: O agendamento "Pão Francês" sobrepõe o agendamento "Pão Integral"
                    em 17/05/2025 das 8:00 às 9:30.
                  </li>
                  <li>
                    <strong>Equipe 1</strong>: Capacidade excedida em 18/05/2025. Máximo recomendado: 8 horas.
                    Agendado: 10 horas.
                  </li>
                </ul>
              </div>
              <div className="mt-2">
                <button className="text-sm text-yellow-800 font-medium">
                  Resolver conflitos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionCalendar;