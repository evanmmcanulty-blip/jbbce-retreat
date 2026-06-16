import React, { createContext, useContext } from 'react';
import { useCollection } from './useCollection';

const UsersContext = createContext([]);

export function UsersProvider({ children }) {
  const { docs: users } = useCollection('users');
  return <UsersContext.Provider value={users}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  return useContext(UsersContext);
}
