export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AIProvider {
  id: string;
  name: string;
  type: "native" | "external";
  config?: {
    api_key?: string;
    api_url?: string;
    model?: string;
  };
}

export type Subject = "General" | "Math" | "Science" | "English" | "History";

export interface AppState {
  messages: Message[];
  selectedProvider: string;
  selectedSubject: Subject;
  darkMode: boolean;
  apiKey?: string; // Temporarily stored for external providers if user provides them
}
