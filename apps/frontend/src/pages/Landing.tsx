import { useNavigate } from "react-router-dom";
import { 
  Grid3x3, 
  Terminal, 
  ArrowRight, 
  Bolt, 
  Lock, 
  ChartNoAxesCombined, 
  Headset, 
  MonitorPlay,
  MessageSquare
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light text-text-main font-mono-retro antialiased overflow-x-hidden">
      <div className="scanlines"></div>
      
      <nav className="fixed w-full z-50 top-0 bg-background-light border-b-3 border-text-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 group cursor-pointer border-2 border-transparent hover:border-text-main p-1 transition-all">
              <div className="w-10 h-10 bg-text-main flex items-center justify-center shadow-brutal">
                <Grid3x3 className="text-background-light w-6 h-6" />
              </div>
              <span className="font-serif-heading font-bold text-3xl tracking-tight text-text-main italic">OPEX</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a className="font-mono-retro font-bold text-sm uppercase hover:underline decoration-2 underline-offset-4 decoration-primary cursor-pointer">Markets</a>
              <a className="font-mono-retro font-bold text-sm uppercase hover:underline decoration-2 underline-offset-4 decoration-primary cursor-pointer">Tools</a>
              <a className="font-mono-retro font-bold text-sm uppercase hover:underline decoration-2 underline-offset-4 decoration-primary cursor-pointer">Learn</a>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/login")} className="hidden md:block font-mono-retro font-bold text-sm underline decoration-2 underline-offset-4 hover:text-primary bg-transparent border-none p-0">LOG IN</button>
              <button onClick={() => navigate("/login")} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 font-bold font-mono-retro text-sm shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-text-main">
                START_TRADING
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-0 lg:pt-40 overflow-hidden min-h-screen flex flex-col justify-between">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 relative z-20">
              <div className="inline-block bg-text-main text-background-light px-3 py-1 mb-6 font-mono-retro text-xs font-bold border-2 border-transparent">
                SYSTEM_READY // V.1.0
              </div>
              <h1 className="font-serif-heading !text-5xl md:!text-8xl lg:!text-9xl leading-[0.9] text-text-main mb-8 -ml-1 break-words hyphens-auto">
                TRADE THE <br/>
                <span className="text-primary italic relative inline-block">
                  NOISE
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-text-main" preserveAspectRatio="none" viewBox="0 0 100 10">
                    <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="2"></path>
                  </svg>
                </span>
              </h1>
              <p className="text-lg md:text-xl text-text-main font-medium mb-10 max-w-xl border-l-4 border-primary pl-6 py-2 leading-tight">
                Raw execution. Zero latency. The brutalist platform for aggressive CFD strategies on Stocks, Crypto, and Forex.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <button onClick={() => navigate("/login")} className="px-8 py-5 bg-text-main text-background-light font-bold text-lg font-mono-retro shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all !border-1 !border-background-light flex items-center justify-center gap-3">
                  OPEN_ACCOUNT
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/login")} className="px-8 py-5 bg-background-light text-text-main font-bold text-lg font-mono-retro !border-2 !border-text-main shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3">
                  <Terminal className="w-5 h-5" />
                  GET_STARTED
                </button>
              </div>
            </div>
            <div className="lg:col-span-5 relative h-full min-h-[400px] lg:min-h-[500px] flex items-center justify-center lg:justify-end overflow-hidden lg:overflow-visible">
              <div className="relative w-full max-w-[300px] md:max-w-md aspect-square">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-text-main/5 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-text-main/5 rounded-full"></div>
                <div className="absolute inset-0 bg-white/50 backdrop-blur-md border border-text-main/10 rounded-lg p-6 shadow-brutal">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <div className="font-mono-retro text-xs text-text-main/60 mb-1">BTC/USD PERP</div>
                      <div className="font-serif-heading text-4xl text-text-main">$48,291.50</div>
                    </div>
                    <div className="px-2 py-1 bg-chart-green/10 text-chart-green text-xs font-mono-retro border border-chart-green/20">
                      +5.2%
                    </div>
                  </div>
                  <svg className="w-full h-48 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 200">
                    <line stroke="rgba(17, 17, 13, 0.05)" strokeWidth="1" x1="0" x2="400" y1="50" y2="50"></line>
                    <line stroke="rgba(17, 17, 13, 0.05)" strokeWidth="1" x1="0" x2="400" y1="100" y2="100"></line>
                    <line stroke="rgba(17, 17, 13, 0.05)" strokeWidth="1" x1="0" x2="400" y1="150" y2="150"></line>
                    <path className="chart-line" d="M0,150 C50,140 80,160 120,110 C160,60 200,80 250,50 C300,20 350,40 400,10" fill="none" stroke="#C1C10B" strokeWidth="1.5"></path>
                    <path className="chart-line" d="M0,180 C60,175 100,185 150,160 C200,135 240,150 280,140 C320,130 360,120 400,125" fill="none" stroke="#E73D27" strokeDasharray="4 4" strokeWidth="1" style={{ opacity: 0.6 }}></path>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#C1C10B" stopOpacity="0.1"></stop>
                        <stop offset="100%" stopColor="#C1C10B" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <path d="M0,150 C50,140 80,160 120,110 C160,60 200,80 250,50 C300,20 350,40 400,10 L400,200 L0,200 Z" fill="url(#chartGradient)" style={{ opacity: 0 }} className="animate-[fadeIn_1s_ease-out_4s_forwards]"></path>
                    <circle cx="400" cy="10" fill="#C1C10B" r="3">
                      <animate attributeName="r" dur="2s" repeatCount="indefinite" values="3;5;3"></animate>
                      <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="1;0.5;1"></animate>
                    </circle>
                  </svg>
                  <div className="mt-8 flex justify-between text-xs font-mono-retro text-text-main/60">
                    <span>10:00</span>
                    <span>11:00</span>
                    <span>12:00</span>
                    <span>13:00</span>
                    <span>14:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full relative z-30 mt-auto border-t-3 border-text-main">
          <div className="bg-primary px-4 py-1 text-white font-mono-retro text-xs font-bold w-fit border-r-3 border-text-main absolute top-[-26px] left-0">
            MARKET_FEED
          </div>
          <div className="ticker-wrap border-none">
            <div className="ticker-content">
              <div className="ticker-item">BTC <span className="text-chart-green">▲ 42,910</span></div>
              <div className="ticker-item">ETH <span className="text-chart-red">▼ 2,240</span></div>
              <div className="ticker-item">SPX <span className="text-chart-green">▲ 4,890</span></div>
              <div className="ticker-item">EUR <span className="text-chart-red">▼ 1.0920</span></div>
              <div className="ticker-item">XAU <span className="text-chart-green">▲ 2,045</span></div>
              <div className="ticker-item">TSLA <span className="text-chart-red">▼ 210.50</span></div>
              <div className="ticker-item">AAPL <span className="text-chart-green">▲ 195.20</span></div>
              {/* Duplicate for seamless loop */}
              <div className="ticker-item">BTC <span className="text-chart-green">▲ 42,910</span></div>
              <div className="ticker-item">ETH <span className="text-chart-red">▼ 2,240</span></div>
              <div className="ticker-item">SPX <span className="text-chart-green">▲ 4,890</span></div>
              <div className="ticker-item">EUR <span className="text-chart-red">▼ 1.0920</span></div>
              <div className="ticker-item">XAU <span className="text-chart-green">▲ 2,045</span></div>
              <div className="ticker-item">TSLA <span className="text-chart-red">▼ 210.50</span></div>
              <div className="ticker-item">AAPL <span className="text-chart-green">▲ 195.20</span></div>
            </div>
          </div>
        </div>
      </main>

      <section className="py-24 bg-white border-b-3 border-text-main relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex flex-col md:flex-row items-end justify-between gap-6 border-b-3 border-text-main pb-6">
            <h2 className="font-serif-heading text-5xl md:text-6xl text-text-main leading-none">
              HARDWARE <br/> SPECS
            </h2>
            <p className="font-mono-retro text-text-main max-w-sm text-sm">
              // SYSTEM DIAGNOSTICS: OPTIMAL<br/>
              High-performance trading infrastructure designed for maximum throughput.
            </p>
          </div>
          <div className="brutalist-grid">
            <div className="bg-background-light border-3 border-text-main p-8 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 font-mono-retro font-bold text-6xl text-text-main/5 group-hover:text-primary/20 transition-colors">01</div>
              <div className="w-16 h-16 bg-primary border-2 border-text-main flex items-center justify-center mb-6 shadow-brutal">
                <Bolt className="text-white w-8 h-8" />
              </div>
              <h3 className="font-serif-heading text-3xl text-text-main mb-4">Latency Zero</h3>
              <p className="font-mono-retro text-sm leading-relaxed border-l-2 border-text-main pl-4">
                20ms execution speed. We cut the fat so you trade the bone. Direct market access protocols enabled.
              </p>
            </div>
            <div className="bg-background-light border-3 border-text-main p-8 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 font-mono-retro font-bold text-6xl text-text-main/5 group-hover:text-primary/20 transition-colors">02</div>
              <div className="w-16 h-16 bg-text-main border-2 border-text-main flex items-center justify-center mb-6 shadow-brutal">
                <Lock className="text-white w-8 h-8" />
              </div>
              <h3 className="font-serif-heading text-3xl text-text-main mb-4">Ironclad Vault</h3>
              <p className="font-mono-retro text-sm leading-relaxed border-l-2 border-text-main pl-4">
                Segregated accounts in tier-1 institutions. 256-bit encryption. Your capital is fortress-secured.
              </p>
            </div>
            <div className="bg-background-light border-3 border-text-main p-8 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 font-mono-retro font-bold text-6xl text-text-main/5 group-hover:text-primary/20 transition-colors">03</div>
              <div className="w-16 h-16 bg-chart-green border-2 border-text-main flex items-center justify-center mb-6 shadow-brutal">
                <ChartNoAxesCombined className="text-text-main w-8 h-8" />
              </div>
              <h3 className="font-serif-heading text-3xl text-text-main mb-4">Deep Data</h3>
              <p className="font-mono-retro text-sm leading-relaxed border-l-2 border-text-main pl-4">
                Raw data feeds. 50+ indicators. Analyze market structure with surgical precision.
              </p>
            </div>
            <div className="bg-background-light border-3 border-text-main p-8 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 font-mono-retro font-bold text-6xl text-text-main/5 group-hover:text-primary/20 transition-colors">04</div>
              <div className="w-16 h-16 bg-chart-red border-2 border-text-main flex items-center justify-center mb-6 shadow-brutal">
                <Headset className="text-white w-8 h-8" />
              </div>
              <h3 className="font-serif-heading text-3xl text-text-main mb-4">24/7 Support</h3>
              <p className="font-mono-retro text-sm leading-relaxed border-l-2 border-text-main pl-4">
                Expert desk always online. No bots. Just traders talking to traders.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background-light border-b-3 border-text-main">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8 bg-text-main p-4 shadow-brutal text-background-light">
            <h2 className="font-serif-heading text-3xl">LIVE_TICKER</h2>
            <a className="font-mono-retro font-bold text-sm hover:underline decoration-primary decoration-2 underline-offset-4 flex items-center gap-1 cursor-pointer">FULL_MARKET <ArrowRight className="w-4 h-4" /></a>
          </div>
          <div className="bg-white border-3 border-text-main shadow-brutal-lg">
            <div className="grid grid-cols-4 p-4 border-b-3 border-text-main bg-gray-100 font-mono-retro text-sm uppercase text-text-main font-bold">
              <div className="col-span-2 md:col-span-1">Asset</div>
              <div className="hidden md:block text-right">Bid</div>
              <div className="hidden md:block text-right">Ask</div>
              <div className="col-span-2 md:col-span-1 text-right">Mov</div>
            </div>
            <div className="grid grid-cols-4 p-4 items-center border-b-2 border-text-main hover:bg-primary/10 transition-colors cursor-pointer font-mono-retro">
              <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                <div className="w-10 h-10 border-2 border-text-main bg-white flex items-center justify-center font-bold text-lg">B</div>
                <div>
                  <div className="font-bold text-text-main uppercase">Bitcoin</div>
                  <div className="text-xs text-text-main/60">BTCUSD</div>
                </div>
              </div>
              <div className="hidden md:block text-right text-text-main">42,885.50</div>
              <div className="hidden md:block text-right text-text-main">42,895.50</div>
              <div className="col-span-2 md:col-span-1 text-right">
                <span className="inline-block px-3 py-1 bg-chart-green text-text-main border-2 border-text-main text-xs font-bold">+2.45%</span>
              </div>
            </div>
            <div className="grid grid-cols-4 p-4 items-center border-b-2 border-text-main hover:bg-primary/10 transition-colors cursor-pointer font-mono-retro">
              <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                <div className="w-10 h-10 border-2 border-text-main bg-white flex items-center justify-center font-bold text-lg">E</div>
                <div>
                  <div className="font-bold text-text-main uppercase">Ethereum</div>
                  <div className="text-xs text-text-main/60">ETHUSD</div>
                </div>
              </div>
              <div className="hidden md:block text-right text-text-main">2,235.10</div>
              <div className="hidden md:block text-right text-text-main">2,238.10</div>
              <div className="col-span-2 md:col-span-1 text-right">
                <span className="inline-block px-3 py-1 bg-chart-red text-white border-2 border-text-main text-xs font-bold">-0.85%</span>
              </div>
            </div>
            <div className="grid grid-cols-4 p-4 items-center hover:bg-primary/10 transition-colors cursor-pointer font-mono-retro">
              <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                <div className="w-10 h-10 border-2 border-text-main bg-white flex items-center justify-center font-bold text-lg">G</div>
                <div>
                  <div className="font-bold text-text-main uppercase">Gold</div>
                  <div className="text-xs text-text-main/60">XAUUSD</div>
                </div>
              </div>
              <div className="hidden md:block text-right text-text-main">2,042.80</div>
              <div className="hidden md:block text-right text-text-main">2,043.20</div>
              <div className="col-span-2 md:col-span-1 text-right">
                <span className="inline-block px-3 py-1 bg-chart-green text-text-main border-2 border-text-main text-xs font-bold">+0.15%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative bg-primary overflow-hidden border-b-3 border-text-main">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#122020 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.2 }}></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-block border-2 border-text-main bg-white px-4 py-1 mb-6 shadow-brutal transform -rotate-2">
            <span className="font-mono-retro font-bold text-text-main">JOIN 50,000+ TRADERS</span>
          </div>
          <h2 className="font-serif-heading text-6xl md:text-7xl text-white mb-8 drop-shadow-[4px_4px_0_rgba(17,17,13,1)]">
            READY TO EXECUTE?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button onClick={() => navigate("/login")} className="w-full sm:w-auto px-10 py-5 bg-text-main text-white border-2 border-white rounded-none font-bold text-xl font-mono-retro shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
              CREATE_ACCOUNT
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-text-main text-background-light pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6 border-b-2 border-background-light/20 pb-4 w-fit">
                <Grid3x3 className="text-primary w-6 h-6" />
                <span className="font-serif-heading font-bold text-2xl text-background-light">OPEX</span>
              </div>
              <p className="font-mono-retro text-xs leading-relaxed mb-6 opacity-70">
                // SYSTEM STATUS: ONLINE<br/>
                Providing brutal execution for the modern trader since 2023.
              </p>
              <div className="flex gap-4">
                <a className="bg-background-light text-text-main p-2 hover:bg-primary hover:text-white transition-colors border border-transparent hover:border-white"><Grid3x3 className="w-5 h-5" /></a>
                <a className="bg-background-light text-text-main p-2 hover:bg-primary hover:text-white transition-colors border border-transparent hover:border-white"><MonitorPlay className="w-5 h-5" /></a>
                <a className="bg-background-light text-text-main p-2 hover:bg-primary hover:text-white transition-colors border border-transparent hover:border-white"><MessageSquare className="w-5 h-5" /></a>
              </div>
            </div>
            <div className="font-mono-retro">
              <h4 className="font-bold text-primary mb-6 text-sm uppercase border-l-2 border-primary pl-2">Markets</h4>
              <ul className="space-y-3 text-xs opacity-80">
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Forex</a></li>
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Indices</a></li>
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Commodities</a></li>
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Crypto</a></li>
              </ul>
            </div>
            <div className="font-mono-retro">
              <h4 className="font-bold text-primary mb-6 text-sm uppercase border-l-2 border-primary pl-2">Platform</h4>
              <ul className="space-y-3 text-xs opacity-80">
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Web Trader</a></li>
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Terminal App</a></li>
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; API Keys</a></li>
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Server Status</a></li>
              </ul>
            </div>
            <div className="font-mono-retro">
              <h4 className="font-bold text-primary mb-6 text-sm uppercase border-l-2 border-primary pl-2">Legal</h4>
              <ul className="space-y-3 text-xs opacity-80">
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Privacy Policy</a></li>
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Terms of Service</a></li>
                <li><a className="hover:text-primary hover:translate-x-1 transition-all inline-block">&gt; Risk Disclosure</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background-light/20 pt-8 text-[10px] leading-relaxed opacity-50 font-mono-retro">
            <p className="mb-4 font-bold uppercase tracking-wider text-chart-red">Risk Warning:</p>
            <p>
              CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. 74-89% of retail investor accounts lose money when trading CFDs with this provider. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.
            </p>
            <p className="mt-4">
              © 2023 Opex Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
