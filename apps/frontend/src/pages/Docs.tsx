import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Database, 
  Webhook, 
  Server, 
  Radio, 
  Layout, 
  Cpu, 
  Layers, 
  ArrowRight,
  Activity,
  ExternalLink
} from "lucide-react";
import { FaGithub, FaXTwitter, FaGlobe } from "react-icons/fa6";

export default function Docs() {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light text-text-main font-mono-retro antialiased overflow-x-hidden min-h-screen pb-20">
      <div className="scanlines"></div>

      {/* NAVIGATION */}
      <nav className="fixed w-full z-50 top-0 bg-background-light border-b-3 border-text-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div 
              className="flex items-center gap-2 group cursor-pointer border-2 border-transparent hover:border-text-main p-1 transition-all"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-text-main flex items-center justify-center p-1">
                <img src="/opex.png" alt="OPEX Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif-heading font-bold text-3xl tracking-tight text-text-main italic">OPEX</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/")} className="hidden md:flex font-mono-retro font-bold text-sm underline decoration-2 underline-offset-4 hover:text-primary bg-transparent border-none p-0 items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> BACK_TO_TERMINAL
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 lg:pt-40 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* HERO SECTION */}
        <section className="mb-20">
            <div className="inline-block bg-text-main text-background-light px-3 py-1 mb-6 font-mono-retro text-xs font-bold border-2 border-text-main shadow-brutal">
            SYSTEM_DOCS // ARCHITECTURE OVERVIEW
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 mb-12">
                <div>
                    <h1 className="font-serif-heading text-6xl md:text-8xl leading-[0.9] text-text-main mb-6">
                    <span className="italic">SYSTEM</span> <br/> ARCHITECTURE
                    </h1>
                    <p className="text-xl text-text-main font-medium border-l-4 border-primary pl-6 py-2 max-w-2xl leading-relaxed">
                        Opex-v2 is a distributed, service-oriented cryptocurrency perpetuals trading platform. We built the trade execution pipeline from scratch—no external massive database locks, just raw in-memory state machines and custom orchestration. Everything else in the app exists to support this execution.
                    </p>
                </div>
                
                {/* AUTHOR LINKS */}
                <div className="flex flex-col gap-3 font-mono-retro text-sm border-2 border-text-main bg-white p-5 shadow-brutal shrink-0">
                    <div className="font-bold border-b-2 border-text-main pb-2 mb-2 text-primary">LINKS // AUTHOR</div>
                    <a href="https://github.com/hxrshit/opex-v2" target="_blank" rel="noreferrer" className="flex items-center justify-between gap-6 hover:text-primary transition-colors group">
                        <span className="flex items-center gap-2"><FaGithub className="w-4 h-4" /> Source Code</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                    <a href="https://twitter.com/hxrshit" target="_blank" rel="noreferrer" className="flex items-center justify-between gap-6 hover:text-primary transition-colors group">
                        <span className="flex items-center gap-2"><FaXTwitter className="w-4 h-4" /> By Harshit</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                    <a href="https://hrsht.me" target="_blank" rel="noreferrer" className="flex items-center justify-between gap-6 hover:text-primary transition-colors group">
                        <span className="flex items-center gap-2"><FaGlobe className="w-4 h-4" /> hrsht.me</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                </div>
            </div>
        </section>

        {/* DATA FLOW DIAGRAM */}
        <section className="mb-24">
            <h2 className="font-serif-heading text-4xl mb-8 flex items-center gap-3">
                <NetworkIcon className="text-primary w-8 h-8" />
                01_THE_PIPELINE
            </h2>
            
            <div className="border-3 border-text-main bg-white p-8 md:p-12 shadow-[8px_8px_0_#11110D] overflow-x-auto">
                <div className="min-w-[800px] flex flex-col gap-12 font-mono-retro text-sm font-bold">
                    
                    {/* TOP ROW: Realtime Data Flow */}
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-text-main/20 -z-10"></div>
                        
                        <FlowBox icon={<Radio className="text-chart-green" />} title="POLLER" borderColor="border-chart-green" />
                        <FlowArrow text="Tick Prices" color="text-chart-green" />
                        
                        <FlowBox icon={<Layers className="text-text-main" />} title="REDIS" subtitle="(Pub/Sub)" />
                        <FlowArrow text="Broadcast" />
                        
                        <FlowBox icon={<Webhook className="text-primary" />} title="WEBSOCKET" borderColor="border-primary" />
                        <FlowArrow text="Live Updates" color="text-primary" />
                        
                        <FlowBox icon={<Layout className="text-text-main" />} title="FRONTEND" highlight />
                    </div>

                    {/* MIDDLE ROW: Execution Flow */}
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-text-main/20 -z-10 w-[70%]"></div>
                        
                        <FlowBox icon={<Layout className="text-text-main" />} title="FRONTEND" highlight />
                        <FlowArrow text="REST POST" />
                        
                        <FlowBox icon={<Server className="text-text-main" />} title="BACKEND" />
                        <FlowArrow text="Push to Queue" />
                        
                        <FlowBox icon={<Layers className="text-text-main" />} title="REDIS" subtitle="(Streams)" />
                        <FlowArrow text="Pull 1-by-1" color="text-chart-red" />
                        
                        <FlowBox icon={<Cpu className="text-white" />} title="ENGINE" bg="bg-chart-red" />
                    </div>

                    {/* BOTTOM ROW: Persistence Flow */}
                    <div className="flex items-center justify-end relative pl-[60%]">
                        <div className="absolute -top-10 right-[15%] w-1 h-14 bg-text-main/20 -z-10"></div>
                        <div className="flex flex-col gap-6 w-full">
                            <div className="flex items-center justify-between w-full">
                                <FlowArrow text="5s Snapshots" />
                                <FlowBox icon={<Database className="text-[#4DB33D]" />} title="MONGO" borderColor="border-[#4DB33D]" />
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <FlowArrow text="Settled Ledger" />
                                <FlowBox icon={<Database className="text-[#336791]" />} title="POSTGRES" borderColor="border-[#336791]" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <p className="font-mono-retro text-sm mt-6 text-text-main/70 italic max-w-3xl">
                * The Engine is decoupled from horizontal scaling constraints. It only reads from Redis Streams exactly once, modifies memory, and persists settled capital to the Postgres Ledger while creating fast-recovery BSON snapshots in Mongo.
            </p>
        </section>

        {/* COMPONENT DEEP DIVES */}
        <section className="mb-24">
            <h2 className="font-serif-heading text-4xl mb-12 flex items-center gap-3">
                <Activity className="text-chart-green w-8 h-8" />
                02_SYSTEM_COMPONENTS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* FRONTEND */}
                <ComponentCard 
                    icon={<Layout className="w-6 h-6" />}
                    title="Frontend"
                    subtitle="React + Vite + Tailwind"
                    what="A brutalist Single Page Application (SPA) serving as the user's trading terminal."
                    why="Speed and psychological synchrony. By using React Query for REST mutations and raw WebSockets for orderbooks, the UI feels instantly responsive."
                    how="When a user clicks 'Buy', the UI sends a REST POST, awaiting the precise JSON response before flashing a success toast. Simultaneously, price ticks animate in via a global WebSocket standard context provider."
                />

                {/* BACKEND */}
                <ComponentCard 
                    icon={<Server className="w-6 h-6" />}
                    title="Backend"
                    subtitle="Node.js + Express + Zod"
                    what="The stateless HTTP orchestration layer and auth gateway."
                    why="To validate user intent, verify JWTs, and handle generic database reads before passing the heavily guarded payload down the execution pipeline."
                    how="It does not process logic! It pushes 'trade_open' payloads to Redis Streams. It then enters a custom while-loop, waiting for the Engine to push an exact success/fail receipt to a Response Stream, mapping Engine errors back to HTTP 411 codes."
                />

                {/* ENGINE */}
                <ComponentCard 
                    icon={<Cpu className="w-6 h-6" />}
                    title="Engine"
                    subtitle="In-Memory State Machine"
                    what="The core component of the platform. A strictly ordered, zero-latency executor that matches trades and enforces liquidations."
                    why="Row-locking in SQL for high-frequency trades is too slow. By running in RAM, execution takes &lt;1ms. This guarantees no race conditions."
                    how="A never-ending Loop pulls 1 item from the Redis Stream at a time, checks if `userBalance[id]` &gt; `margin`, deducts it, generates an order, and replies. No Postgres commits block this loop."
                />

                {/* REDIS */}
                <ComponentCard 
                    icon={<Layers className="w-6 h-6" />}
                    title="Redis"
                    subtitle="Central Message Bus"
                    what="The backbone that connects the isolated microservices."
                    why="To allow horizontal scaling of Frontends and WebSockets while maintaining a sequential choke-point for the Engine."
                    how="Uses 'PubSub' channels for ephemeral ticks (like prices) pushing millions of updates. Uses 'Streams' (Consumer Groups) for strict, reliable processing of trade inputs that the Engine must not miss."
                />

                {/* POLLER */}
                <ComponentCard 
                    icon={<Radio className="w-6 h-6" />}
                    title="Poller"
                    subtitle="External Oracle Bridge"
                    what="An isolated Node process constantly fetching fresh market data."
                    why="The Engine and Backend should not manage external HTTP/WS connections to Backpack. It keeps internal systems safe."
                    how="Connects to external exchange WebSockets, normalizes the orderbook payloads to our internal schema, and floods them onto the Redis `ws:price:update` PubSub channel without touching Postgres."
                />

                {/* WEBSOCKET */}
                <ComponentCard 
                    icon={<Webhook className="w-6 h-6" />}
                    title="WebSocket Server"
                    subtitle="Horizontal Dispatcher"
                    what="A dedicated server whose sole purpose is managing thousands of active browser TCP connections."
                    why="If the core Engine had to broadcast to 10,000 browsers every time BTC moved $1, it would lag the trading engine."
                    how="Runs a `ping/pong` heartbeat pattern to prune dead connections. Subscribes to Redis PubSub and blindly forwards those messages down to any active browser filtering by global channels or specific `userId` state invalidations."
                />

                {/* POSTGRES */}
                <ComponentCard 
                    icon={<Database className="w-6 h-6 text-[#336791]" />}
                    title="PostgreSQL"
                    subtitle="Relational Ledger // Neon DB"
                    what="The final, ACID-compliant source of truth for settled capital."
                    why="While the Engine runs in RAM, users need their permanent history and Auth records safely stored on disk."
                    how="Managed via Drizzle ORM. Features compound indices on `(user_id, created_at)` for instant history fetches. Only interacts with closed trades, deposits, and profile edits—never blocks an active trade."
                />

                {/* MONGO */}
                <ComponentCard 
                    icon={<Database className="w-6 h-6 text-[#4DB33D]" />}
                    title="MongoDB"
                    subtitle="BSON State Snapshots"
                    what="A NoSQL document store capturing the Engine's exact memory state."
                    why="If the system completely crashes, replaying 6 months of Redis Streams to rebuild user balances would take hours. We need instant recovery."
                    how="Every 5 seconds, the Engine serializes its entire Javascript Map (`openOrders`, `balances`) down to a massive document string and saves it. On boot, the Engine loads the last snapshot, reads its stamped Redis ID, and only replays the 5 seconds of missed traffic."
                />

            </div>
        </section>

      </main>
    </div>
  );
}

// ----------------------------------------------------------------------------
// HELPER COMPONENTS FOR DIAGRAM
// ----------------------------------------------------------------------------

function NetworkIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="16" y="16" width="6" height="6" rx="1"/>
            <rect x="2" y="16" width="6" height="6" rx="1"/>
            <rect x="9" y="2" width="6" height="6" rx="1"/>
            <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
            <path d="M12 12V8"/>
        </svg>
    );
}

function FlowBox({ icon, title, subtitle, highlight, bg, borderColor }: { icon: React.ReactNode, title: string, subtitle?: string, highlight?: boolean, bg?: string, borderColor?: string }) {
    return (
        <div className={`
            flex flex-col items-center justify-center p-4 min-w-[140px] border-3 shadow-brutal z-10 transition-transform hover:-translate-y-1
            ${bg ? bg : 'bg-white'}
            ${highlight ? 'border-text-main shadow-[4px_4px_0_#1B8C88]' : borderColor ? borderColor : 'border-text-main'}
        `}>
            <div className="mb-2">{icon}</div>
            <div className={`font-bold text-center ${bg ? 'text-white' : 'text-text-main'}`}>{title}</div>
            {subtitle && <div className={`text-[10px] text-center mt-1 ${bg ? 'text-white/70' : 'text-text-main/70'}`}>{subtitle}</div>}
        </div>
    );
}

function FlowArrow({ text, color }: { text: string, color?: string }) {
    return (
        <div className={`flex flex-col items-center justify-center shrink-0 w-24 z-10 ${color ? color : 'text-text-main'}`}>
            <span className="text-[10px] sm:text-xs mb-1 bg-background-light px-2 py-0.5 border border-current font-bold whitespace-nowrap hidden sm:block">
                {text}
            </span>
            <div className="flex items-center w-full">
                <div className="h-0.5 w-full bg-current"></div>
                <ArrowRight className="w-4 h-4 -ml-2 shrink-0" strokeWidth={3} />
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// HELPER COMPONENT FOR DEEP DIVES
// ----------------------------------------------------------------------------

function ComponentCard({ icon, title, subtitle, what, why, how }: { icon: React.ReactNode, title: string, subtitle: string, what: string, why: string, how: string }) {
    return (
        <div className="bg-white border-3 border-text-main p-6 shadow-brutal relative group hover:shadow-[6px_6px_0_#1B8C88] transition-all">
            <div className="flex items-start gap-4 mb-6 pb-4 border-b-2 border-text-main/20">
                <div className="w-12 h-12 shrink-0 bg-background-light border-2 border-text-main flex items-center justify-center shadow-brutal group-hover:-translate-y-1 transition-transform">
                    {icon}
                </div>
                <div>
                    <h3 className="font-serif-heading text-3xl text-text-main leading-tight">{title}</h3>
                    <div className="font-mono-retro text-xs text-primary font-bold uppercase">{subtitle}</div>
                </div>
            </div>
            
            <div className="space-y-4 font-mono-retro text-sm text-text-main/90">
                <div>
                    <strong className="text-text-main bg-text-main/5 px-1">What:</strong> {what}
                </div>
                <div>
                    <strong className="text-text-main bg-text-main/5 px-1">Why:</strong> {why}
                </div>
                <div className="pt-2 border-t-2 border-dotted border-text-main/20">
                    <strong className="text-primary">Implementation:</strong> {how}
                </div>
            </div>
        </div>
    );
}
