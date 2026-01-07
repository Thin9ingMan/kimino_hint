import { Routes, Route, Navigate } from "react-router-dom";

import { legacyRedirectRoutes } from "@/compat/legacyRedirectRoutes";

import { HomeScreen } from "../feat/home/screens/HomeScreen";
import { HelpScreen } from "../feat/misc/screens/HelpScreen";
import { AuthErrorScreen } from "../feat/misc/screens/AuthErrorScreen";
import { NotFoundScreen } from "../feat/misc/screens/NotFoundScreen";
import { MeHubScreen } from "../feat/me/screens/MeHubScreen";
import { MyProfileScreen } from "../feat/me/screens/MyProfileScreen";
import { EditMyProfileScreen } from "../feat/me/screens/EditMyProfileScreen";
import { ProfileListScreen } from "../feat/profiles/screens/ProfileListScreen";
import { ProfileDetailScreen } from "../feat/profiles/screens/ProfileDetailScreen";
import { EventsHubScreen } from "../feat/events/screens/EventsHubScreen";
import { CreateEventScreen } from "../feat/events/screens/CreateEventScreen";
import { JoinEventScreen } from "../feat/events/screens/JoinEventScreen";
import { EventLobbyScreen } from "../feat/events/screens/EventLobbyScreen";
import { EventLiveScreen } from "../feat/events/screens/EventLiveScreen";
import { QuizIntroScreen } from "../feat/quiz/screens/QuizIntroScreen";
import { QuizQuestionScreen } from "../feat/quiz/screens/QuizQuestionScreen";
import { QuizAnswerScreen } from "../feat/quiz/screens/QuizAnswerScreen";
import { QuizResultScreen } from "../feat/quiz/screens/QuizResultScreen";
import { QrHubScreen } from "../feat/qr/screens/QrHubScreen";
import { QrProfileScreen } from "../feat/qr/screens/QrProfileScreen";
import { QrScanScreen } from "../feat/qr/screens/QrScanScreen";

export function AppRouter() {
  return (
    <Routes>
      {/* Root redirect to home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Top/Common */}
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/help" element={<HelpScreen />} />
      <Route path="/error/auth" element={<AuthErrorScreen />} />

      {/* Me */}
      <Route path="/me" element={<MeHubScreen />} />
      <Route path="/me/profile" element={<MyProfileScreen />} />
      <Route path="/me/profile/edit" element={<EditMyProfileScreen />} />

      {/* Profiles */}
      <Route path="/profiles" element={<ProfileListScreen />} />
      <Route path="/profiles/:userId" element={<ProfileDetailScreen />} />

      {/* Events */}
      <Route path="/events" element={<EventsHubScreen />} />
      <Route path="/events/new" element={<CreateEventScreen />} />
      <Route path="/events/join" element={<JoinEventScreen />} />
      <Route path="/events/:eventId" element={<EventLobbyScreen />} />
      <Route path="/events/:eventId/live" element={<EventLiveScreen />} />

      {/* Quiz (under events) */}
      <Route path="/events/:eventId/quiz" element={<QuizIntroScreen />} />
      <Route
        path="/events/:eventId/quiz/:questionNo"
        element={<QuizQuestionScreen />}
      />
      <Route
        path="/events/:eventId/quiz/:questionNo/answer"
        element={<QuizAnswerScreen />}
      />
      <Route path="/events/:eventId/result" element={<QuizResultScreen />} />

      {/* QR */}
      <Route path="/qr" element={<QrHubScreen />} />
      <Route path="/qr/profile" element={<QrProfileScreen />} />
      <Route path="/qr/scan" element={<QrScanScreen />} />

      {/* Legacy URL compat (Phase 0): keep old URLs as thin redirects */}
      {legacyRedirectRoutes}

      {/* 404 */}
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}
