import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import CollectivesList from "./pages/CollectivesList.tsx";
import CollectiveNew from "./pages/CollectiveNew.tsx";
import CollectiveJoin from "./pages/CollectiveJoin.tsx";
import CollectiveEdit from "./pages/CollectiveEdit.tsx";
import CollectiveManageMembersList from "./pages/CollectiveManageMembersList.tsx";
import CollectiveManageMember from "./pages/CollectiveManageMember.tsx";
import CollectiveDetail from "./pages/CollectiveDetail.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Posts from "./pages/Posts.tsx";
import PostsBrowse from "./pages/PostsBrowse.tsx";
import PostFormPage from "./pages/PostFormPage.tsx";
import Layout from "./components/Layout.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/users/:username" element={<UserProfile />} />
        <Route path="/collectives" element={<CollectivesList />} />
        <Route path="/collectives/new" element={<CollectiveNew />} />
        <Route
          path="/collectives/:collectiveSlug/join"
          element={<CollectiveJoin />}
        />
        <Route
          path="/collectives/:collectiveSlug/edit"
          element={<CollectiveEdit />}
        />
        <Route
          path="/collectives/:collectiveSlug/members/manage/:username"
          element={<CollectiveManageMember />}
        />
        <Route
          path="/collectives/:collectiveSlug/members/manage"
          element={<CollectiveManageMembersList />}
        />
        <Route path="/collectives/:collectiveSlug" element={<CollectiveDetail />} />
        <Route path="/posts/new" element={<PostFormPage mode="new" />} />
        <Route path="/posts/browse/:postSlug" element={<PostsBrowse />} />
        <Route path="/posts/browse" element={<PostsBrowse />} />
        <Route path="/posts/:postSlug/edit" element={<PostFormPage mode="edit" />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
