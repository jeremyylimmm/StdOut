import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dummyQuestions } from "./mockData";
import { apiFetch } from "./api";

const AppStateContext = createContext(null);

const defaultSettings = {
  role: "Frontend Engineer",
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
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings] = useState(defaultSettings);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const result = await apiFetch("/auth/me", { method: "GET" });
        setUser(result.user);
      } catch (error) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    bootstrapSession();
  }, []);

  const loginWithGoogleToken = async (idToken) => {
    const result = await apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error) {
      // Ignore network/logout race and still clear local state.
    }

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
      authLoading,
      theme,
      settings,
      questions: dummyQuestions,
      questionIndex,
      currentQuestion: dummyQuestions[questionIndex],
      loginWithGoogleToken,
      logout,
      toggleTheme,
      saveSettings,
      startInterview,
      nextQuestion,
      resetInterview,
    }),
    [user, authLoading, theme, settings, questionIndex],
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
