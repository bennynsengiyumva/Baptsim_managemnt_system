import apiClient from './api';

export interface SearchResult {
  id: number;
  type: string;
  name: string;
  subtitle: string;
  url: string;
}

export interface SearchResponse {
  candidates: SearchResult[];
  users: SearchResult[];
  churches: SearchResult[];
  districts: SearchResult[];
  fields: SearchResult[];
}

export const searchService = {
  globalSearch: async (query: string): Promise<SearchResponse> => {
    const response = await apiClient.get(`/api/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};
