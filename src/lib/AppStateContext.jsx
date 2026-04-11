import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dummyQuestions } from "./mockData";

const AppStateContext = createContext(null);

const defaultSettings = {
  interviewName: "Frontend Interview",
  company: "Google",
  difficulty: "Medium",
  durationMinutes: 15,
};

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem("theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const login = (username, userId) => {
    const name = username?.trim() || "Candidate";
    setUser({
      id: userId || "mock-user-1",
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = useMemo(
    () => ({
      user,
      theme,
      settings,
      questions: dummyQuestions,
      questionIndex,
      currentQuestion: dummyQuestions[questionIndex],
      login,
      logout,
      toggleTheme,
      saveSettings,
      startInterview,
      nextQuestion,
      resetInterview,
    }),
    [user, theme, settings, questionIndex],
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
