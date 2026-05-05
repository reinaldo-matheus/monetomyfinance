import { createContext, useContext, useState } from "react";

const ProfileTypeContext = createContext(null);

export function ProfileTypeProvider({ children }) {
  const [profileType, setProfileType] = useState(
    () => localStorage.getItem("moneto_profile_type") || "pf",
  );

  const toggle = (type) => {
    setProfileType(type);
    localStorage.setItem("moneto_profile_type", type);
  };

  return (
    <ProfileTypeContext.Provider
      value={{ profileType, toggle, isPJ: profileType === "pj" }}
    >
      {children}
    </ProfileTypeContext.Provider>
  );
}

export function useProfileType() {
  const ctx = useContext(ProfileTypeContext);
  if (!ctx)
    throw new Error("useProfileType must be used inside ProfileTypeProvider");
  return ctx;
}
