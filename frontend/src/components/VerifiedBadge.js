import { ShieldCheck, Crown } from 'lucide-react';

const VerifiedBadge = ({ size = 14, isAdmin = false, className = '' }) => {
  if (isAdmin) {
    return (
      <span className={`inline-flex items-center justify-center shrink-0 ${className}`} title="Admin" data-testid="admin-crown-badge">
        <Crown size={size} strokeWidth={2.5} className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} title="Verified" data-testid="verified-badge">
      <ShieldCheck size={size} strokeWidth={2.5} className="text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
    </span>
  );
};

export default VerifiedBadge;
