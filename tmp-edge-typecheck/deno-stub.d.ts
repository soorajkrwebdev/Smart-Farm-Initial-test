// TEMPORARY type-check stubs for the refresh-market-prices Edge Function.
// Deno is not installed in this workspace, so the function is type-checked with
// the project's TypeScript compiler against these stubs and then deleted.
declare namespace Deno {
  function serve(handler: (request: Request) => Response | Promise<Response>): void;
  const env: { get(key: string): string | undefined };
}
