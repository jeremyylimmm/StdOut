import { createContext, useContext, useMemo, useState } from "react";
import { dummyQuestions } from "./mockData";

const AppStateContext = createContext(null);

const defaultSettings = {
  role: "Frontend Engineer",
  difficulty: "Medium",
  durationMinutes: 15,
};

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [questionIndex, setQuestionIndex] = useState(0);

  const login = (username) => {
    const name = username?.trim() || "Candidate";
    setUser({
      id: "mock-user-1",
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    });
  };

  const logout = () => {
    setUser(null);
    setQuestionIndex(0);
    setSettings(defaultSettings);
  };

  const saveSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const startInterview = () => {
    setQuestionIndex(0);
  };

  const nextQuestion = () => {
    setQuestionIndex((prev) => Math.min(prev + 1, dummyQuestions.length - 1));
  };

  const resetInterview = () => {
    setQuestionIndex(0);
  };

  const value = useMemo(
    () => ({
      user,
      settings,
      questions: dummyQuestions,
      questionIndex,
      currentQuestion: dummyQuestions[questionIndex],
      login,
      logout,
      saveSettings,
      startInterview,
      nextQuestion,
      resetInterview,
    }),
    [user, settings, questionIndex],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}
