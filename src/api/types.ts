// Custom Request type for Bun.serve with route params
export interface BunRequest extends Request {
  params: Record<string, string>;
}
