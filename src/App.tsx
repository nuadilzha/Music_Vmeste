import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProfileDetailPage } from './pages/ProfileDetailPage';
import { GroupProfilePage } from './pages/GroupProfilePage';
import { MyProfilePage } from './pages/MyProfilePage';
import { CommunityPage } from './pages/CommunityPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ListingsPage } from './pages/ListingsPage';
import { ListingEditorPage } from './pages/ListingsPage';
import { GroupEditorPage } from './pages/GroupPage';
import { AuthPage } from './pages/AuthPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile/:id" element={<ProfileDetailPage />} />
        <Route path="/group/:id" element={<GroupProfilePage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/groups/new" element={<GroupEditorPage />} />
        <Route path="/groups/:id/edit" element={<GroupEditorPage />} />
        <Route path="/listings/new" element={<ListingEditorPage />} />
        <Route path="/listings/:id/edit" element={<ListingEditorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}
