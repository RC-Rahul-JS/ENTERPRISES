import { createContext, useContext, useEffect, useState } from "react";
import useApi from "../api/useApi";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";

// Create context
const UserContext = createContext(null);

// Provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const { postData } = useApi();
    const navigate = useNavigate();
    const [role, setRole] = useState(Cookies.get("role")); // Store role in state

    useEffect(() => {
    let user=sessionStorage.getItem('user')
    if(!user){
        navigate("/login")
    }else{
    }
    }, []); 

    return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

// Custom hook to access user data
export const useUser = () => useContext(UserContext);
