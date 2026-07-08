import { create} from"zustand";

export const useDashboardStore = create((set) => ({// Search & Filter State
 searchTerm:"",
 setSearchTerm: (term) => set({ searchTerm: term}),
 
 showSearchSuggestions: false,
 setShowSearchSuggestions: (show) => set({ showSearchSuggestions: show}),
 
 skillFilter:"All",
 setSkillFilter: (skill) => set({ skillFilter: skill}),
 
 workTypeFilter:"All",
 setWorkTypeFilter: (type) => set({ workTypeFilter: type}),
 
 maxBudgetFilter: 10000,
 setMaxBudgetFilter: (budget) => set({ maxBudgetFilter: budget}),
 
 sortBy:"latest",
 setSortBy: (sort) => set({ sortBy: sort}),
 
 page: 1,
 setPage: (p) => set({ page: p}),
 
 limit: 10,
 setLimit: (l) => set({ limit: l}),

 // Auth State
 currentUser: null,
 setCurrentUser: (user) => set({ currentUser: user})
}));
