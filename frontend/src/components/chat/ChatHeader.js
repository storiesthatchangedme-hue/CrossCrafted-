import { ArrowLeft, ShieldCheck } from 'lucide-react';

const ChatHeader = ({ otherUser, onBack }) => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0 bg-[#0F172A]">
    <button
      onClick={onBack}
      className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:bg-white/[0.1] transition-all"
      aria-label="Go back"
    >
      <ArrowLeft size={18} />
    </button>
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
      {otherUser?.profile_image
        ? <img src={otherUser.profile_image} alt={otherUser.name} className="w-full h-full object-cover" />
        : otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-white truncate">{otherUser?.name || 'User'}</p>
      <p className="text-[11px] text-emerald-400 font-medium">Online</p>
    </div>
    {otherUser?.is_verified && (
      <ShieldCheck size={16} className="text-[#38BDF8] shrink-0" />
    )}
  </div>
);

export default ChatHeader;