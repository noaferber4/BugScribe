import { LayoutGrid, Plus, Bookmark, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

type CenterViewType = 'home' | 'form' | 'saved-bugs' | 'template-builder';

export function Sidebar({
  centerViewType,
  onNavHome,
  onNavCreateTemplate,
  onNavSavedBugs,
}: {
  centerViewType: CenterViewType;
  onNavHome: () => void;
  onNavCreateTemplate: () => void;
  onNavSavedBugs: () => void;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      label: 'Home',
      icon: LayoutGrid,
      onClick: onNavHome,
      active: centerViewType === 'home' || centerViewType === 'form',
    },
    {
      label: 'Create Template',
      icon: Plus,
      onClick: onNavCreateTemplate,
      active: centerViewType === 'template-builder',
    },
    {
      label: 'Saved Bugs',
      icon: Bookmark,
      onClick: onNavSavedBugs,
      active: centerViewType === 'saved-bugs',
    },
  ];

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="w-60 flex flex-col h-full bg-[#05080f] border-r border-white/10">
      {/* Header — clicking the logo goes to landing page without signing out */}
      <div className="px-5 pt-5 pb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="h-7 w-7 bg-cyan-500 rounded flex items-center justify-center text-[#05080f] text-sm font-bold shrink-0">
            B
          </div>
          <span className="font-semibold text-white tracking-tight">BugScribe</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                item.active
                  ? 'bg-white/[0.07] text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {user && (
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-white/30 truncate mb-2">{user.email}</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
