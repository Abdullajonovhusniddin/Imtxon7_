import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "../components/UI/Loader/Loader";
import ProtectRouter from "../components/protect/ProtectRouter";
import GusetRoute from "../components/protect/GuestROute";

// Lazy Loaded Components
const Login = lazy(() => import("../pages/Login/Login"));
const Management = lazy(() => import("../pages/management/Management"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));
const MainLayout = lazy(() => import("../layout/MainLayout"));
const Courses = lazy(() => import("../pages/management/Courses/Courses"));
const ArchiveCourses = lazy(() => import("../pages/management/Courses/ArchiveCourses"));
const Rooms = lazy(() => import("../pages/management/Rooms/Rooms"));
const ArchiveRooms = lazy(() => import("../pages/management/Rooms/ArchiveRooms"));
const Staff = lazy(() => import("../pages/management/Staff/Staff"));
const Teachers = lazy(() => import("../pages/Teachers/Teachers"));
const ArchiveTeachers = lazy(() => import("../pages/Teachers/ArchiveTeachers"));
const Students = lazy(() => import("../pages/Students/Students"));
const ArchiveStudents = lazy(() => import("../pages/Students/ArchiveStudents"));
const Groups = lazy(() => import("../pages/Groups/Groups"));
const ArchiveGroups = lazy(() => import("../pages/Groups/ArchiveGroups.jsx"));
const GroupDetail = lazy(() => import("../pages/Groups/GroupDetail/GroupDetail"));
const LessonDetail = lazy(() => import("../pages/Groups/LessonDetail/LessonDetail"));
const CreateHomework = lazy(() => import("../pages/Groups/CreateHomework/CreateHomework"));
const HomeworkResults = lazy(() => import("../pages/Groups/HomeworkResults/HomeworkResults"));
const StudentHomeworkDetail = lazy(() => import("../pages/Groups/HomeworkResults/StudentHomeworkDetail"));
const ImtihonResults = lazy(() => import("../pages/Groups/ImtihonResults/ImtihonResults"));
const StudentImtihonDetail = lazy(() => import("../pages/Groups/ImtihonResults/StudentImtihonDetail"));
const Gifts = lazy(() => import("../pages/Gifts/Gifts"));
const Default = lazy(() => import("../pages/management/default/Default"));
const TestPage = lazy(() => import("../pages/management/TestPage/TestPage"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: (
      <GusetRoute>
        <Suspense fallback={<Loader />}>
          <Login />
        </Suspense>
      </GusetRoute>
    )
  },
  {
    element: (
      <ProtectRouter>
        <Suspense fallback={<Loader />}>
          <MainLayout />
        </Suspense>
      </ProtectRouter>
    ),
    children: [
      {
        path: '/dashboard',
        element: <Suspense fallback={<Loader />}><Dashboard /></Suspense>, 
      },
      {
        path: '/dashboard/teachers',
        element: <Suspense fallback={<Loader />}><Teachers /></Suspense>
      },
      {
        path: '/dashboard/teachers/archive',
        element: <Suspense fallback={<Loader />}><ArchiveTeachers /></Suspense>
      },
      {
        path: '/dashboard/students',
        element: <Suspense fallback={<Loader />}><Students /></Suspense>
      },
      {
        path: '/dashboard/students/archive',
        element: <Suspense fallback={<Loader />}><ArchiveStudents /></Suspense>
      },
      {
        path: '/dashboard/groups',
        element: <Suspense fallback={<Loader />}><Groups /></Suspense>
      },
      {
        path: '/dashboard/groups/archive',
        element: <Suspense fallback={<Loader />}><ArchiveGroups /></Suspense>
      },
      {
        path: '/dashboard/groups/:id',
        element: <Suspense fallback={<Loader />}><GroupDetail /></Suspense>
      },
      {
        path: '/dashboard/groups/:id/lesson/:date',
        element: <Suspense fallback={<Loader />}><LessonDetail /></Suspense>
      },
      {
        path: '/dashboard/groups/:id/homework/create',
        element: <Suspense fallback={<Loader />}><CreateHomework /></Suspense>
      },
      {
        path: '/dashboard/groups/:id/homework/:homeworkId/results',
        element: <Suspense fallback={<Loader />}><HomeworkResults /></Suspense>
      },
      {
        path: '/dashboard/groups/:id/homework/:homeworkId/results/:resultId',
        element: <Suspense fallback={<Loader />}><StudentHomeworkDetail /></Suspense>
      },
      {
        path: '/dashboard/groups/:id/exam/:examId/results',
        element: <Suspense fallback={<Loader />}><ImtihonResults /></Suspense>
      },
      {
        path: '/dashboard/groups/:id/exam/:examId/results/:resultId',
        element: <Suspense fallback={<Loader />}><StudentImtihonDetail /></Suspense>
      },
      {
        path: '/dashboard/gifts',
        element: <Suspense fallback={<Loader />}><Gifts /></Suspense>
      },
      {
        path: '/management',
        element: <Suspense fallback={<Loader />}><Management /></Suspense>, 
        children: [
          {
            path: 'courses',
            element: <Suspense fallback={<Loader />}><Courses /></Suspense>
          },
          {
            path: 'courses/archive',
            element: <Suspense fallback={<Loader />}><ArchiveCourses /></Suspense>
          },
          {
            path: 'rooms',
            element: <Suspense fallback={<Loader />}><Rooms /></Suspense>
          },
          {
            path: 'rooms/archive',
            element: <Suspense fallback={<Loader />}><ArchiveRooms /></Suspense>
          },
          {
            path: 'staff',
            element: <Suspense fallback={<Loader />}><Staff /></Suspense>
          },
          {
            path: 'coin',
            element: <Suspense fallback={<Loader />}><TestPage title="Coin" /></Suspense>
          },
          {
            path: 'send-message',
            element: <Suspense fallback={<Loader />}><TestPage title="Xabar Yuborish" /></Suspense>
          },
          {
            index: true,
            element: <Suspense fallback={<Loader />}><Default /></Suspense>
          },
        ]
      },
    ]
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<Loader />}>
        <NotFound />
      </Suspense>
    )
  }
]);

export default router;