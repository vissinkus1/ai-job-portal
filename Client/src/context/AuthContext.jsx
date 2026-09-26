import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(!!localStorage.getItem("token"));

    // Initial load - verify token and get user profile
    useEffect(() => {
        const loadUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get("/profile/me");
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Auth init error:", error);
                // If it's a 401, the interceptor will try to refresh.
                // If it completely fails, we clear state.
                if (error.response?.status === 401) {
                    logout();
                }
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [token]);

    const setAuthSession = (newToken, newUser) => {
        if (newToken) {
            localStorage.setItem("token", newToken);
            setToken(newToken);
        }
        if (newUser) {
            setUser(newUser);
        }
        setIsAuthenticated(true);
        setLoading(false);
    };

    const login = async (email, password) => {
        const res = await api.post("/auth/login", { email, password });
        const { token: newToken, user: userData } = res.data;

        if (newToken) {
            localStorage.setItem("token", newToken);
            setToken(newToken);
        }

        if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
        } else {
            try {
                const profileRes = await api.get("/profile/me");
                setUser(profileRes.data);
                setIsAuthenticated(true);
            } catch (err) {
                console.warn("Could not fetch profile during login, using token session", err);
                setIsAuthenticated(true);
            }
        }
        
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // Ignore if server is down or token already invalid
        }
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    // Use this after profile updates to keep context in sync
    const refreshUser = async () => {
        try {
            const res = await api.get("/profile/me");
            setUser(res.data);
            return res.data;
        } catch (error) {
            console.error("Failed to refresh user data", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout, refreshUser, setAuthSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
