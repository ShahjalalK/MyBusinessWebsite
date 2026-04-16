import { create } from 'zustand'
import { BlogPost, blogPosts } from '../components/BlogMainPage/blogData';

// Store-er structure define kora
interface BlogState {
  posts: BlogPost[]; // ১. এখানে posts যোগ করতে হবে
  activeCategory: string;
  searchQuery: string;
  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useBlogStore = create<BlogState>((set) => ({
  // ১. Initial/Default States
  posts: blogPosts, // ২. এখানে ডাটা সেট করে দিন
  activeCategory: 'All Posts',
  searchQuery: '',

  // ২. Actions
  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))