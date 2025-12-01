import { Camera, Clock, MapPin, Radio, Shield, Smartphone, Wifi } from 'lucide-react';
import Image from 'next/image';

const MOCK_EVENTS = [
    {
        id: 1,
        title: "Riverstone Retreat",
        type: "Surveillance",
        location: "Sector 4",
        time: "10:42 AM",
        image: "https://images.unsplash.com/photo-1558036117-15db5275252b?auto=format&fit=crop&w=500&q=60",
        status: "Active",
        source: "Camera 04"
    },
    {
        id: 2,
        title: "Willow Creek Estate",
        type: "Signal",
        location: "Sector 7",
        time: "10:38 AM",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=60",
        status: "Analyzing",
        source: "Wifi Sniffer"
    },
    {
        id: 3,
        title: "Starlight Ridge",
        type: "Social",
        location: "Sector 2",
        time: "10:15 AM",
        image: "https://images.unsplash.com/photo-1600596542815-2495db98dada?auto=format&fit=crop&w=500&q=60",
        status: "Flagged",
        source: "Twitter API"
    },
    {
        id: 4,
        title: "Hidden Valley",
        type: "IoT",
        location: "Sector 9",
        time: "09:55 AM",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=500&q=60",
        status: "Secure",
        source: "Smart Home"
    }
];

export default function OsintFeed() {
    return (
        <div className="w-96 bg-[#13161f] border-r border-gray-800 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white mb-1">365 Results</h2>
                <div className="flex gap-2 text-xs text-gray-500">
                    <span>Live Feed</span>
                    <span>•</span>
                    <span>Los Angeles</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 px-6 py-4 border-b border-gray-800 overflow-x-auto no-scrollbar">
                <button className="text-white text-sm font-medium border-b-2 border-blue-500 pb-1">All</button>
                <button className="text-gray-500 text-sm font-medium hover:text-white pb-1">Events</button>
                <button className="text-gray-500 text-sm font-medium hover:text-white pb-1">Crimes</button>
                <button className="text-gray-500 text-sm font-medium hover:text-white pb-1">Transport</button>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {MOCK_EVENTS.map((event) => (
                    <div key={event.id} className="bg-[#1a1d29] rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors group cursor-pointer">
                        <div className="relative h-32">
                            <Image src={event.image} alt={event.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-mono border border-white/10">
                                {event.status}
                            </div>
                            <div className="absolute top-2 left-2 bg-blue-600 p-1 rounded">
                                {event.type === 'Surveillance' && <Camera className="w-3 h-3 text-white" />}
                                {event.type === 'Signal' && <Wifi className="w-3 h-3 text-white" />}
                                {event.type === 'Social' && <Smartphone className="w-3 h-3 text-white" />}
                                {event.type === 'IoT' && <Radio className="w-3 h-3 text-white" />}
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="text-white font-bold text-sm mb-1">{event.title}</h3>
                            <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                                Detected activity in {event.location}. Analysis indicates potential anomaly requiring operator review.
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-500 bg-[#13161f] p-2 rounded border border-gray-800">
                                <div className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    <span>ID: #{Math.floor(Math.random() * 99999)}</span>
                                </div>
                                <div className="flex items-center gap-1 justify-end">
                                    <Clock className="w-3 h-3" />
                                    <span>{event.time}</span>
                                </div>
                                <div className="col-span-2 flex items-center gap-1 text-blue-400">
                                    <MapPin className="w-3 h-3" />
                                    <span>Source: {event.source}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Footer */}
            <div className="p-4 border-t border-gray-800 bg-[#0f111a]">
                <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-gray-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-sm"></div>
                        Crimes
                    </span>
                    <span className="text-white font-mono">24</span>
                </div>
                <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-gray-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                        Transportation
                    </span>
                    <span className="text-white font-mono">12</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
                        Exposed Devices
                    </span>
                    <span className="text-white font-mono">842</span>
                </div>
            </div>
        </div>
    );
}
