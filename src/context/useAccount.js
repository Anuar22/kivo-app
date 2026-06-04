import { useContext } from "react";
import { AccountCtx } from "./accountStore.js";

export const useAccount = () => useContext(AccountCtx);
