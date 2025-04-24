/**
 * Tipos para o sistema de gestão de produção
 */

// Tipos para o módulo de personalização
export interface UserPreferencesTheme {
  colorScheme: string;
  fontSize: 'small' | 'normal' | 'large';
  layout: 'compact' | 'default' | 'comfortable';
  contrast: 'normal' | 'high';
  fontFamily: string;
  isDarkMode: boolean;
  enableAnimations: boolean;
}

// Tipos para gerenciamento de receitas
export interface Ingredient {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  notes?: string;
}

export interface RecipeVersion {
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
  ingredientsSnapshot: Ingredient[];
  yield: number;
  yieldUnit: string;
  isActive: boolean;
}

export interface Recipe {
  id: string;
  productId: string;
  productName: string;
  description?: string;
  prepTime: number; // Em minutos
  cookTime: number; // Em minutos
  totalTime: number; // Em minutos
  difficulty: 'easy' | 'medium' | 'hard';
  currentVersion: RecipeVersion;
  versions: RecipeVersion[];
  instructions: string[];
  tags: string[];
  nutritionalInfo?: Record<string, any>;
  isActive: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastProducedAt?: Date;
}

// Tipos para agendamento de produção
export interface ProductionSchedule {
  id: string;
  recipeId: string;
  recipeName: string;
  productId: string;
  quantity: number;
  unit: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string; // Para identificar o recurso (equipe, equipamento, etc.)
  color?: string; // Cor baseada na prioridade
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  isAllDay?: boolean;
  editable?: boolean;
}

// Tipos para controle de produção
export interface ProductionBatch {
  id: string;
  scheduleId?: string; // Opcional, se foi agendado previamente
  recipeId: string;
  recipeVersionId: string;
  versionNumber: number;
  recipeName: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'started' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  producedBy: string;
  qualityCheck?: {
    passed: boolean;
    checkedBy?: string;
    checkedAt?: Date;
    notes?: string;
  };
  consumedMaterials: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
  }[];
  wastage?: {
    quantity: number;
    reason: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionAdjustment {
  id: string;
  batchId: string;
  productId: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  adjustedBy: string;
  adjustedAt: Date;
}

// Tipos para capacidade de produção
export interface ProductionResource {
  id: string;
  name: string;
  type: 'staff' | 'equipment' | 'workspace';
  capacity: number;  // Quanto pode produzir por período
  capacityUnit: string;
  capacityPeriod: 'hour' | 'day' | 'week';
  availability: {
    dayOfWeek: number; // 0 = domingo, 1 = segunda, etc.
    startTime: string; // formato HH:MM
    endTime: string;   // formato HH:MM
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionCapacity {
  resourceId: string;
  resourceName: string;
  productId: string;
  productName: string;
  capacityPerHour: number;
  setupTimeMinutes: number;
  cleanupTimeMinutes: number;
}

// Tipos para relatórios de produção
export interface ProductionReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  filters: Record<string, any>;
  columns: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
}

export interface ProductionAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalBatches: number;
    completedBatches: number;
    inProgressBatches: number;
    failedBatches: number;
    totalQuantity: number;
    totalWastage: number;
    wastagePercentage: number;
    efficiencyRate: number; // Produção real / capacidade teórica
  };
  byProduct: {
    productId: string;
    productName: string;
    quantity: number;
    batches: number;
  }[];
  byResource: {
    resourceId: string;
    resourceName: string;
    utilizationRate: number;
    hoursUtilized: number;
  }[];
  timeline: {
    date: Date;
    batchesCompleted: number;
    quantity: number;
  }[];
}