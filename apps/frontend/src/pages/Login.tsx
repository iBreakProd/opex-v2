import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: async () => {
      const cleanEmail = email.trim();
      console.log(`\n\n[Frontend] Attempting Login/Signup for: ${cleanEmail}`);
      await api.post("/auth/signup", { email: cleanEmail });
      console.log(`\n\n[Frontend] Login/Signup Request Sent.`);
    },
    onSuccess: () => {
      console.log(`\n\n[Frontend] Login/Signup Success.`);
    },
    onError: (err) => {
        console.error(`\n\n[Frontend] Login/Signup Failed:`, err);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-6 bg-background-light font-mono-retro">
      <div className="scanlines"></div>
      <div className="w-full max-w-md bg-white border-3 border-text-main p-8 shadow-brutal relative z-10">
        <div className="absolute top-0 right-0 p-2 bg-primary text-white font-mono-retro text-xs font-bold border-l-2 border-b-2 border-text-main">
            SECURE_ACCESS
        </div>
        
        <h1 className="mb-6 text-center font-serif-heading text-4xl font-bold text-text-main">
          System Access
        </h1>
        <p className="mb-8 text-center font-mono-retro text-sm text-text-main/70">
          Enter credentials to bypass security protocols.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutate();
          }}
          className="grid gap-6"
        >
          <div className="grid gap-2">
            <label htmlFor="email" className="font-mono-retro text-xs font-bold uppercase text-text-main">
              Email_Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="trader@opex.com"
              value={email}
              onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
              }}
              className="w-full bg-background-light text-text-main border-2 border-text-main px-4 py-3 outline-none font-mono-retro text-sm focus:bg-white transition-colors placeholder:text-text-main/30"
            />
          </div>
          <button 
            type="submit" 
            disabled={isPending} 
            className="w-full bg-text-main text-white py-4 font-mono-retro font-bold text-sm hover:bg-white hover:text-text-main border-2 border-transparent hover:border-text-main transition-all shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            {isPending ? "AUTHENTICATING..." : "SEND_MAGIC_LINK"}
          </button>
        </form>

        {isSuccess ? (
          <div className="mt-6 border-2 border-text-main bg-chart-green/20 p-4 font-mono-retro text-xs text-text-main">
            <span className="font-bold">SUCCESS:</span> Magic link dispatched to secure inbox. Awaiting verification.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 border-2 border-text-main bg-chart-red/20 p-4 font-mono-retro text-xs text-text-main">
            <span className="font-bold">ERROR:</span> {(error as Error).message || "Connection terminated unexpectedly."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
