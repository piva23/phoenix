import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useDashboardStore = create(
  persist(
    (set) => ({
      widgetOrder: ['weather', 'media', 'reading', 'habits', 'upcoming', 'panorama'],
      visionBoardConfig: {
        gridCols: 3,
        showCaptions: true,
      },
      lastImportedAt: null,

      setWidgetOrder: (order) => set({ widgetOrder: order }),
      
      updateVisionConfig: (config) => set((state) => ({
        visionBoardConfig: { ...state.visionBoardConfig, ...config }
      })),

      importDashboardConfig: (jsonData) => {
        try {
          const config = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
          
          set({
            widgetOrder: config.widgetOrder || ['weather', 'media', 'reading', 'habits', 'upcoming', 'panorama'],
            visionBoardConfig: config.visionBoardConfig || { gridCols: 3, showCaptions: true },
            lastImportedAt: Date.now(),
          });
          
          return { success: true };
        } catch (error) {
          console.error('Falha ao importar JSON de configuração do Dashboard:', error);
          return { success: false, error: error.message };
        }
      }
    }),
    {
      name: 'phoenix-dashboard'
    }
  )
)
