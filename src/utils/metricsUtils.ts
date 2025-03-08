
import { Question, QuestionAttempt, QuestionCategory, QuestionMetricsEntry, QuestionMetricsStore } from "@/types/quiz";
import { qbanks, loadQBanks } from "@/data/questions";
import { STORES, putItem, getItem } from "@/utils/indexedDB";

const METRICS_STORAGE_KEY = 'questionMetricsStore';

// Helper function to trigger a metrics update event
const triggerMetricsUpdate = () => {
  window.dispatchEvent(new CustomEvent('metricsUpdated'));
};

// Initialize metrics for all questions
export const initializeMetrics = async (): Promise<void> => {
  try {
    // Make sure qbanks are loaded first
    await loadQBanks();
    
    // Get existing metrics from IndexedDB
    const storedMetrics = await getItem<{id: string, data: QuestionMetricsStore}>(STORES.QUESTION_METRICS, 'metrics');
    let existingMetrics: QuestionMetricsStore = storedMetrics?.data || {};
    let updated = false;
    
    // Initialize all questions
    for (const qbank of qbanks) {
      // Ensure questions is resolved if it's a Promise
      let questions: Question[] = [];
      if (qbank.questions instanceof Promise) {
        questions = await qbank.questions;
      } else {
        questions = qbank.questions;
      }
      
      for (const question of questions) {
        // Check if this question exists in metrics
        if (!existingMetrics[question.id]) {
          // If not, initialize it as unused (or set based on attempts if they exist)
          if (question.attempts && question.attempts.length > 0) {
            // This question has been attempted but metrics were lost - reconstruct from attempts
            const lastAttempt = question.attempts[question.attempts.length - 1];
            let status: QuestionCategory = 'unused';
            
            if (lastAttempt.selectedAnswer === null) {
              status = 'omitted';
            } else if (lastAttempt.isCorrect) {
              status = 'correct';
            } else {
              status = 'incorrect';
            }
            
            existingMetrics[question.id] = {
              status,
              lastAttemptDate: lastAttempt.date,
              isFlagged: Boolean(question.isFlagged)
            };
          } else {
            // No attempts, initialize as unused
            existingMetrics[question.id] = {
              status: 'unused',
              isFlagged: Boolean(question.isFlagged)
            };
          }
          updated = true;
        } else {
          // Question exists in metrics, but check if isFlagged status matches
          if (existingMetrics[question.id].isFlagged !== Boolean(question.isFlagged)) {
            existingMetrics[question.id].isFlagged = Boolean(question.isFlagged);
            updated = true;
          }
        }
      }
    }
    
    // Clean up metrics for deleted questions
    const allQuestionIds = new Set<number>();
    for (const qbank of qbanks) {
      let questions: Question[] = [];
      if (qbank.questions instanceof Promise) {
        questions = await qbank.questions;
      } else {
        questions = qbank.questions;
      }
      
      for (const question of questions) {
        allQuestionIds.add(question.id);
      }
    }
    
    Object.keys(existingMetrics).forEach(idStr => {
      const id = parseInt(idStr);
      if (!allQuestionIds.has(id)) {
        delete existingMetrics[id];
        updated = true;
      }
    });
    
    if (updated) {
      // Save updated metrics to IndexedDB
      await putItem(STORES.QUESTION_METRICS, { id: 'metrics', data: existingMetrics });
      
      // Also update localStorage for backward compatibility
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(existingMetrics));
      
      // Trigger update event
      triggerMetricsUpdate();
    }
  } catch (error) {
    console.error('Error initializing metrics:', error);
  }
};

// Get the full metrics store
export const getMetricsStore = async (): Promise<QuestionMetricsStore> => {
  try {
    // Try to get from IndexedDB first
    const storedMetrics = await getItem<{id: string, data: QuestionMetricsStore}>(STORES.QUESTION_METRICS, 'metrics');
    
    if (storedMetrics && storedMetrics.data) {
      return storedMetrics.data;
    }
    
    // Fallback to localStorage
    const localMetrics = localStorage.getItem(METRICS_STORAGE_KEY);
    if (localMetrics) {
      const parsedMetrics = JSON.parse(localMetrics);
      
      // Migrate to IndexedDB for future use
      await putItem(STORES.QUESTION_METRICS, { id: 'metrics', data: parsedMetrics });
      
      return parsedMetrics;
    }
    
    // If no metrics found, initialize them
    await initializeMetrics();
    
    // Try again after initialization
    const initializedMetrics = await getItem<{id: string, data: QuestionMetricsStore}>(STORES.QUESTION_METRICS, 'metrics');
    if (initializedMetrics && initializedMetrics.data) {
      return initializedMetrics.data;
    }
    
    return {};
  } catch (error) {
    console.error('Error getting metrics store:', error);
    
    // Last resort: try localStorage
    try {
      const localMetrics = localStorage.getItem(METRICS_STORAGE_KEY);
      return localMetrics ? JSON.parse(localMetrics) : {};
    } catch (e) {
      console.error('Failed to load from localStorage too:', e);
      return {};
    }
  }
};

// Save the metrics store
export const saveMetricsStore = async (metrics: QuestionMetricsStore): Promise<void> => {
  try {
    // Save to IndexedDB
    await putItem(STORES.QUESTION_METRICS, { id: 'metrics', data: metrics });
    
    // Also update localStorage for backward compatibility
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
    
    // Trigger update event
    triggerMetricsUpdate();
  } catch (error) {
    console.error('Error saving metrics store:', error);
    
    // Fallback to localStorage
    try {
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
      // Still trigger the event even if only localStorage was updated
      triggerMetricsUpdate();
    } catch (e) {
      console.error('Failed to save to localStorage too:', e);
    }
  }
};

// Update metrics for a single question
export const updateQuestionMetrics = async (
  questionId: number,
  status: QuestionCategory,
  isFlagged?: boolean
): Promise<void> => {
  try {
    const metrics = await getMetricsStore();
    
    // Get existing entry or create a new one
    const entry = metrics[questionId] || {
      status: 'unused',
      isFlagged: false
    };
    
    // Update status
    entry.status = status;
    entry.lastAttemptDate = new Date().toISOString();
    
    // Only update flag status if explicitly provided
    if (isFlagged !== undefined) {
      entry.isFlagged = isFlagged;
    }
    
    metrics[questionId] = entry;
    await saveMetricsStore(metrics);
  } catch (error) {
    console.error('Error updating question metrics:', error);
  }
};

// Update metrics after a quiz attempt
export const updateMetricsFromAttempt = async (attempt: QuestionAttempt): Promise<void> => {
  let status: QuestionCategory;
  
  if (attempt.selectedAnswer === null) {
    status = 'omitted';
  } else if (attempt.isCorrect) {
    status = 'correct';
  } else {
    status = 'incorrect';
  }
  
  await updateQuestionMetrics(attempt.questionId, status, attempt.isFlagged);
};

// Update flag status for a question
export const updateQuestionFlag = async (questionId: number, isFlagged: boolean): Promise<void> => {
  try {
    const metrics = await getMetricsStore();
    
    if (!metrics[questionId]) {
      metrics[questionId] = {
        status: 'unused',
        isFlagged
      };
    } else {
      metrics[questionId].isFlagged = isFlagged;
    }
    
    await saveMetricsStore(metrics);
  } catch (error) {
    console.error('Error updating question flag:', error);
  }
};

// Reset all metrics to unused (but keep flags)
export const resetMetrics = async (): Promise<void> => {
  try {
    const metrics = await getMetricsStore();
    
    Object.keys(metrics).forEach(questionId => {
      const flagged = metrics[questionId].isFlagged;
      metrics[questionId] = {
        status: 'unused',
        isFlagged: flagged
      };
    });
    
    await saveMetricsStore(metrics);
  } catch (error) {
    console.error('Error resetting metrics:', error);
  }
};

// Calculate metrics counts
export const calculateMetrics = async () => {
  try {
    // First ensure metrics are initialized
    await initializeMetrics();
    
    const metrics = await getMetricsStore();
    
    const counts = {
      unused: 0,
      used: 0,
      correct: 0,
      incorrect: 0,
      omitted: 0,
      flagged: 0
    };
    
    // Count questions in each category
    Object.values(metrics).forEach(entry => {
      counts[entry.status]++;
      if (entry.status !== 'unused') {
        counts.used++;
      }
      if (entry.isFlagged) {
        counts.flagged++;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {
      unused: 0,
      used: 0,
      correct: 0,
      incorrect: 0,
      omitted: 0,
      flagged: 0
    };
  }
};

// Get filtered questions based on active filters
export const getFilteredQuestions = (questions: Question[], activeFilters: string[]): Question[] => {
  // If no filters are active, return all questions
  if (activeFilters.length === 0) return questions;
  
  // Get metrics from localStorage (synchronous to avoid Promise in render)
  let metrics: QuestionMetricsStore = {};
  try {
    const localMetrics = localStorage.getItem(METRICS_STORAGE_KEY);
    if (localMetrics) {
      metrics = JSON.parse(localMetrics);
    }
  } catch (error) {
    console.error('Error getting metrics from localStorage:', error);
  }
  
  return questions.filter(question => {
    // If no metrics for this question yet, it's unused
    const questionMetrics = metrics[question.id] || { status: 'unused', isFlagged: false };
    
    // Check if this question matches any of the active filters
    return activeFilters.some(filter => {
      switch (filter) {
        case 'unused':
          return questionMetrics.status === 'unused';
        case 'used':
          return questionMetrics.status !== 'unused';
        case 'correct':
          return questionMetrics.status === 'correct';
        case 'incorrect':
          return questionMetrics.status === 'incorrect';
        case 'omitted':
          return questionMetrics.status === 'omitted';
        case 'flagged':
          return questionMetrics.isFlagged;
        default:
          return false;
      }
    });
  });
};
