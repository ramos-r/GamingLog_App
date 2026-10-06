import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { useFriendsPanel } from "../hooks/use-friends-panel";
import { FriendsPanel } from "./friends-panel";
import { FriendsPanelProvider } from "./friends-panel-provider";

// Layout for every page that has the top bar: the page on the left and, when
// the user opens it, the friends panel on the right.
export function AppShell() {
  return (
    <FriendsPanelProvider>
      <ShellLayout />
    </FriendsPanelProvider>
  );
}

function ShellLayout() {
  const { user } = useAuth();
  const { isOpen } = useFriendsPanel();

  return (
    <div className="flex">
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
      {user && isOpen && <FriendsPanel />}
    </div>
  );
}
