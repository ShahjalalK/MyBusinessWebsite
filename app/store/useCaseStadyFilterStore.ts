import { create } from 'zustand'

export type Category = 'All' | 'E-commerce' | 'Lead Generation' | 'Tracking Setup' | 'Google Ads';

interface FilterState {
  activeTab: Category;
  setActiveTab: (tab: Category) => void;
}

export const useCaseStadyFilterStore = create<FilterState>((set) => ({
  activeTab: 'All',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))