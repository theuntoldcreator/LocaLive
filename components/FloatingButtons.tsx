import { Locate, Navigation, Share2 } from 'lucide-react';

interface FloatingButtonsProps {
    onCenter: () => void;
    onToggleFollow: () => void;
    isFollowing: boolean;
    onShare?: () => void;
    showShare?: boolean;
}

export default function FloatingButtons({
    onCenter,
    onToggleFollow,
    isFollowing,
    onShare,
    showShare = false
}: FloatingButtonsProps) {
    return (
        <div className="absolute bottom-32 right-4 flex flex-col gap-2 z-[1000]">
            {showShare && (
                <button
                    onClick={onShare}
                    className="bg-black border border-white p-3 text-white hover:bg-white hover:text-black transition-colors"
                    title="Share Location"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            )}

            <button
                onClick={onToggleFollow}
                className={`p-3 border transition-colors ${isFollowing
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-white border-white hover:bg-gray-900'
                    }`}
                title="Toggle Follow Mode"
            >
                <Navigation className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
            </button>

            <button
                onClick={onCenter}
                className="bg-black border border-white p-3 text-white hover:bg-white hover:text-black transition-colors"
                title="Center Map"
            >
                <Locate className="w-5 h-5" />
            </button>
        </div>
    );
}
