import { Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import { legacyRedirectRoutes } from "./legacyRouter";

import { HomeScreen } from "./feat/home/screens/HomeScreen";
import { HelpScreen } from "./feat/misc/screens/HelpScreen";
import { AuthErrorScreen } from "./feat/misc/screens/AuthErrorScreen";
import { NotFoundScreen } from "./feat/misc/screens/NotFoundScreen";
import { MeHubScreen } from "./feat/me/screens/MeHubScreen";
import { MyProfileScreen } from "./feat/me/screens/MyProfileScreen";
import { EditMyProfileScreen } from "./feat/me/screens/EditMyProfileScreen";
import { ProfileListScreen } from "./feat/profiles/screens/ProfileListScreen";
import { ProfileDetailScreen } from "./feat/profiles/screens/ProfileDetailScreen";
import { EventsHubScreen } from "./feat/events/screens/EventsHubScreen";
import { CreateEventScreen } from "./feat/events/screens/CreateEventScreen";
import { JoinEventScreen } from "./feat/events/screens/JoinEventScreen";
import { EventLobbyScreen } from "./feat/events/screens/EventLobbyScreen";
import { EventLiveScreen } from "./feat/events/screens/EventLiveScreen";
import { QuizIntroScreen } from "./feat/quiz/screens/QuizIntroScreen";
import { QuizEditScreen } from "./feat/quiz/screens/QuizEditScreen";
import { QuizChallengeListScreen } from "./feat/quiz/screens/QuizChallengeListScreen";
import { QuizSequenceScreen } from "./feat/quiz/screens/QuizSequenceScreen";
import { QuizQuestionScreen } from "./feat/quiz/screens/QuizQuestionScreen";
import { QuizResultScreen } from "./feat/quiz/screens/QuizResultScreen";
import { QuizRewardsScreen } from "./feat/quiz/screens/QuizRewardsScreen";
import { QrJoinScreen } from "./feat/qr/screens/QrJoinScreen";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomeScreen />} loader={HomeScreen.loader} />
      <Route path="/help" element={<HelpScreen />} />
      <Route path="/error/auth" element={<AuthErrorScreen />} />
      <Route path="/me" element={<MeHubScreen />} loader={MeHubScreen.loader} />
      <Route
        path="/me/profile"
        element={<MyProfileScreen />}
        loader={MyProfileScreen.loader}
      />
      <Route
        path="/me/profile/edit"
        element={<EditMyProfileScreen />}
        loader={EditMyProfileScreen.loader}
      />
      <Route
        path="/profiles"
        element={<ProfileListScreen />}
        loader={ProfileListScreen.loader}
      />
      <Route
        path="/profiles/:userId"
        element={<ProfileDetailScreen />}
        loader={ProfileDetailScreen.loader}
      />
      <Route
        path="/events"
        element={<EventsHubScreen />}
        loader={EventsHubScreen.loader}
      />
      <Route
        path="/events/new"
        element={<CreateEventScreen />}
        loader={CreateEventScreen.loader}
      />
      <Route
        path="/events/join"
        element={<JoinEventScreen />}
        loader={JoinEventScreen.loader}
      />
      <Route
        path="/events/:eventId"
        element={<EventLobbyScreen />}
        loader={EventLobbyScreen.loader}
      />
      <Route
        path="/events/:eventId/live"
        element={<EventLiveScreen />}
        loader={EventLiveScreen.loader}
      />
      <Route
        path="/events/:eventId/quiz"
        element={<QuizIntroScreen />}
        loader={QuizIntroScreen.loader}
      />
      <Route
        path="/events/:eventId/quiz/edit"
        element={<QuizEditScreen />}
        loader={QuizEditScreen.loader}
      />
      <Route
        path="/events/:eventId/quiz/challenges"
        element={<QuizChallengeListScreen />}
        loader={QuizChallengeListScreen.loader}
      />
      <Route
        path="/events/:eventId/quiz/sequence"
        element={<QuizSequenceScreen />}
        loader={QuizSequenceScreen.loader}
      />
      <Route
        path="/events/:eventId/quiz/challenge/:targetUserId/:questionNo"
        element={<QuizQuestionScreen />}
        loader={QuizQuestionScreen.loader}
      />
      <Route
        path="/events/:eventId/quiz/challenge/:targetUserId/result"
        element={<QuizResultScreen />}
        loader={QuizResultScreen.loader}
      />
      <Route
        path="/events/:eventId/quiz/challenge/:targetUserId/rewards"
        element={<QuizRewardsScreen />}
        loader={QuizRewardsScreen.loader}
      />
      <Route
        path="/qr/join"
        element={<QrJoinScreen />}
        loader={QrJoinScreen.loader}
      />
      {legacyRedirectRoutes}
      <Route path="*" element={<NotFoundScreen />} />
    </Route>,
  ),
);

export function AppRouter() {
  // This component might be obsolete if we use RouterProvider directly in App.tsx
  // but keeping it for now if needed.
  return null;
}
