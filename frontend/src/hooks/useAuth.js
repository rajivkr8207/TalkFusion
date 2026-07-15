import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchProfile,
  updateProfile,
  clearError,
  clearUpdateSuccess,
  selectUser,
  selectAuthLoading,
  selectAuthError,
  selectUpdateSuccess,
} from "../features/auth/authSlice";

/**
 * useAuth — single hook to handle all auth actions and state.
 * Components never import dispatch/selectors directly; they use this hook.
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const updateSuccess = useSelector(selectUpdateSuccess);

  const handleLogin = async (credentials) => {
    const result = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(result)) {
      navigate("/");
    }
    return result;
  };

  const handleRegister = async (userData) => {
    const result = await dispatch(registerUser(userData));
    if (registerUser.fulfilled.match(result)) {
      navigate("/");
    }
    return result;
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  const handleFetchProfile = () => dispatch(fetchProfile());

  const handleUpdateProfile = (data) => dispatch(updateProfile(data));

  const handleClearError = () => dispatch(clearError());

  const handleClearUpdateSuccess = () => dispatch(clearUpdateSuccess());

  return {
    user,
    loading,
    error,
    updateSuccess,
    handleLogin,
    handleRegister,
    handleLogout,
    handleFetchProfile,
    handleUpdateProfile,
    handleClearError,
    handleClearUpdateSuccess,
  };
};
