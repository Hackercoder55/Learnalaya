// supabase/functions/types.d.ts
declare const Deno: any;

declare module "https://esm.sh/*" {
  const m: any;
  export default m;
  export * from "https://esm.sh/*";
}

// fallback for any remote modules
declare module "*" { const m: any; export default m; }
