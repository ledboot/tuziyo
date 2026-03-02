import { type LoaderFunctionArgs, redirect } from "react-router";
import {
  useLoaderData,
  useNavigate,
  Outlet,
  Link,
  Form,
  useParams,
} from "react-router";
import type { User, Session } from "../lib/db";
import { Plus, MessageSquare, LogOut, Image as ImageIcon } from "lucide-react";
import { requireUser } from "../lib/auth.server";
import { getSessionsForUser, createSession } from "../lib/db";
import { v4 as uuidv4 } from "uuid";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireUser(request, context);
  const db = context.cloudflare.env.DB;

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  // Handle creating a new session via loader parameter
  if (action === "new") {
    const newSessionId = uuidv4();
    await createSession(db, newSessionId, user.id, "New Session");
    return redirect(`/nano-banana/${newSessionId}`);
  }

  const sessions = await getSessionsForUser(db, user.id);

  const isBaseRoute =
    url.pathname === "/nano-banana" || url.pathname === "/nano-banana/";

  // If no sessions exist, and the user just arrived, create one
  if (sessions.length === 0 && isBaseRoute) {
    const newSessionId = uuidv4();
    await createSession(db, newSessionId, user.id, "New Session");
    return redirect(`/nano-banana/${newSessionId}`);
  }

  // If user hits the base route but has sessions, redirect to the most recent one
  if (isBaseRoute && sessions.length > 0) {
    return redirect(`/nano-banana/${sessions[0].id}`);
  }

  return { user, sessions };
}

export default function NanoBananaLayout() {
  const { user, sessions } = useLoaderData() as {
    user: User;
    sessions: Session[];
  };
  const navigate = useNavigate();
  const { sessionId } = useParams();

  return (
    <div className="flex flex-1 h-full bg-gray-50 dark:bg-zinc-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <button
            onClick={() => navigate("/nano-banana?action=new")}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary-brand hover:bg-primary-brand/90 text-white rounded-lg shadow-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.map((session) => {
            const isActive = session.id === sessionId;
            return (
              <Link
                key={session.id}
                to={`/nano-banana/${session.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                  isActive
                    ? "bg-primary-brand/10 dark:bg-primary-brand/20"
                    : "hover:bg-gray-100 dark:hover:bg-zinc-700"
                }`}
              >
                <MessageSquare
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-primary-brand"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-primary-brand"
                  }`}
                />
                <div className="flex-1 truncate">
                  <p
                    className={`text-sm font-medium truncate ${
                      isActive
                        ? "text-primary-brand font-semibold"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {session.title}
                  </p>
                  <p
                    className={`text-xs ${
                      isActive
                        ? "text-primary-brand/70"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {new Date(session.created_at * 1000).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-brand/10 text-primary-brand flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-25">
                {user.name}
              </div>
            </div>
            <Form action="/logout" method="post">
              <button
                type="submit"
                className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-zinc-900">
        <Outlet />
      </div>
    </div>
  );
}
